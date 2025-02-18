import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestEnvironmentVariables,
} from '@configs/KafkaStepScheduleRequestConfig';
import { WorkflowExecutionStepController } from '@controllers/WorkflowExecutionStepController';
import KafkaCommitOffsetsException from '@exceptions/KafkaCommitOffsetsException';
import KafkaConnectionException from '@exceptions/KafkaConnectionException';
import { SchedulerDomain } from '@interfaces/domains/SchedulerDomain';
import { StepScheduleExceptionOrchestratorGateway } from '@interfaces/gateways/StepScheduleExceptionOrchestratorGateway';
import { ConfigService } from '@nestjs/config';
import { ClientKafka, KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { StepScheduleException } from '@shared/StepScheduleException';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';
import { Producer } from 'kafkajs';

describe('WorkflowExecutionStepController', () => {
  const stepScheduleRequestExample: StepScheduleRequest = {
    name: 'stepName',
    task: 'taskName',
    inputArgs: {
      arg1: 'arg1',
      arg2: 'arg2',
    },
    workflowExecutionId: 'workflowExecutionId',
  };

  let controller: WorkflowExecutionStepController;
  let kafkaClientMock: jest.Mocked<Partial<ClientKafka>>;
  let schedulerDomainMock: jest.Mocked<Partial<SchedulerDomain>>;
  let stepScheduleExceptionOrchestratorGatewayMock: jest.Mocked<
    Partial<StepScheduleExceptionOrchestratorGateway>
  >;
  let configServiceMock: jest.Mocked<
    Partial<ConfigService<KafkaStepScheduleRequestEnvironmentVariables>>
  >;
  let kafkaContextMock: jest.Mocked<KafkaContext>;

  beforeEach(async () => {
    kafkaClientMock = {
      subscribeToResponseOf: jest.fn(),
      connect: jest.fn(),
    };
    schedulerDomainMock = {
      scheduleStepExecution: jest.fn(),
    };
    stepScheduleExceptionOrchestratorGatewayMock = {
      notify: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn().mockReturnValue('KAFKA_TOPIC_SSR'),
    };
    kafkaContextMock = {
      getMessage: jest.fn().mockReturnValue({ offset: 'offset' }),
      getTopic: jest.fn().mockReturnValue('KAFKA_TOPIC_SSR'),
      getPartition: jest.fn().mockReturnValue(1),
      getConsumer: jest.fn().mockReturnValue({ commitOffsets: jest.fn() }),
    } as unknown as jest.Mocked<KafkaContext>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowExecutionStepController],
      providers: [
        { provide: KafkaStepScheduleRequestClient, useValue: kafkaClientMock },
        { provide: SchedulerDomain, useValue: schedulerDomainMock },
        {
          provide: StepScheduleExceptionOrchestratorGateway,
          useValue: stepScheduleExceptionOrchestratorGatewayMock,
        },
        { provide: ConfigService, useValue: configServiceMock },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    controller = module.get<WorkflowExecutionStepController>(
      WorkflowExecutionStepController,
    );
  });

  describe('onModuleInit', () => {
    it('should connect to Kafka topic', async () => {
      jest.spyOn(kafkaClientMock, 'connect').mockResolvedValue({} as Producer);
      await expect(controller.onModuleInit()).resolves.not.toThrow();
    });

    it('should throw an error if connection to Kafka topic fails', async () => {
      jest
        .spyOn(kafkaClientMock, 'connect')
        .mockRejectedValue(new Error('Kafka connection error'));
      await expect(controller.onModuleInit()).rejects.toThrow(
        KafkaConnectionException,
      );
    });
  });

  describe('handleWorkflowExecutionStep', () => {
    it('should handle step schedule request', async () => {
      jest
        .spyOn(schedulerDomainMock, 'scheduleStepExecution')
        .mockResolvedValue({
          error: null,
        });
      await expect(
        controller.handleWorkflowExecutionStep(
          stepScheduleRequestExample,
          kafkaContextMock,
        ),
      ).resolves.not.toThrow();
      expect(schedulerDomainMock.scheduleStepExecution).toHaveBeenCalledWith(
        stepScheduleRequestExample,
      );
      expect(
        stepScheduleExceptionOrchestratorGatewayMock.notify,
      ).not.toHaveBeenCalled();
    });

    const testStepScheduleException =
      (exception: StepScheduleException) => async () => {
        jest
          .spyOn(schedulerDomainMock, 'scheduleStepExecution')
          .mockResolvedValue({
            error: exception,
          });
        await expect(
          controller.handleWorkflowExecutionStep(
            stepScheduleRequestExample,
            kafkaContextMock,
          ),
        ).resolves.not.toThrow();
        expect(
          stepScheduleExceptionOrchestratorGatewayMock.notify,
        ).toHaveBeenCalledWith(stepScheduleRequestExample, exception);
      };

    it(
      'should notify orchestrator if task not exits',
      testStepScheduleException(StepScheduleException.TASK_NOT_EXISTS),
    );

    it(
      'should notify orchestrator if task param not exits',
      testStepScheduleException(StepScheduleException.TASK_PARAM_NOT_EXISTS),
    );

    it(
      'should notify orchestrator if task param missing',
      testStepScheduleException(StepScheduleException.TASK_PARAM_MISSING),
    );

    it('should log a message if the step is scheduled successfully', async () => {
      jest
        .spyOn(schedulerDomainMock, 'scheduleStepExecution')
        .mockResolvedValue({
          error: null,
        });
      const spy = jest.spyOn(controller['LOGGER'], 'debug');
      await controller.handleWorkflowExecutionStep(
        stepScheduleRequestExample,
        kafkaContextMock,
      );
      expect(spy).toHaveBeenCalledWith(
        `Step with name ${stepScheduleRequestExample.name} from workflow execution with id ${stepScheduleRequestExample.workflowExecutionId} scheduled successfully`,
      );
    });

    it('should commit offset for step schedule request', async () => {
      jest
        .spyOn(schedulerDomainMock, 'scheduleStepExecution')
        .mockResolvedValue({
          error: null,
        });
      const spy = jest.spyOn(kafkaContextMock.getConsumer(), 'commitOffsets');
      await controller.handleWorkflowExecutionStep(
        stepScheduleRequestExample,
        kafkaContextMock,
      );
      expect(spy).toHaveBeenCalledWith([
        { topic: 'KAFKA_TOPIC_SSR', partition: 1, offset: 'offset' },
      ]);
    });

    it('should commit offset even if the schedule fails', async () => {
      jest
        .spyOn(schedulerDomainMock, 'scheduleStepExecution')
        .mockResolvedValue({
          error: StepScheduleException.TASK_ERROR,
        });
      const spy = jest.spyOn(kafkaContextMock.getConsumer(), 'commitOffsets');
      await controller.handleWorkflowExecutionStep(
        stepScheduleRequestExample,
        kafkaContextMock,
      );
      expect(spy).toHaveBeenCalledWith([
        { topic: 'KAFKA_TOPIC_SSR', partition: 1, offset: 'offset' },
      ]);
    });

    it('should throw an error if commiting offset fails', async () => {
      jest
        .spyOn(schedulerDomainMock, 'scheduleStepExecution')
        .mockResolvedValue({
          error: null,
        });
      jest
        .spyOn(kafkaContextMock.getConsumer(), 'commitOffsets')
        .mockRejectedValue(new Error('Commit offset error'));
      await expect(
        controller.handleWorkflowExecutionStep(
          stepScheduleRequestExample,
          kafkaContextMock,
        ),
      ).rejects.toThrow(KafkaCommitOffsetsException);
    });
  });
});
