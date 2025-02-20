import {
  KafkaWorkflowExecutionRequestClient,
  KafkaWorkflowExecutionRequestEnvironmentVariables,
} from '@configs/KafkaWorkflowExecutionRequestConfig';
import { WorkflowExecutionRequestController } from '@controllers/WorkflowExecutionRequestController';
import { CannotRunNewWorkflowExecutionException } from '@exceptions/CannotRunNewWorkflowExecution';
import KafkaConnectionException from '@exceptions/KakfaConnectionException';
import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { Producer } from '@nestjs/microservices/external/kafka.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';
import { WorkflowExecutionRequest } from '@shared/WorkflowExecutionRequest';

describe('WorkflowExecutionRequestController', () => {
  const executionRequestExample: WorkflowExecutionRequest = {
    executionId: '123',
    description: 'Description',
    inputArguments: {},
    inputParams: {},
    name: 'Name',
    plan: { steps: [] },
  };

  let controller: WorkflowExecutionRequestController;
  let kafkaClientMock: jest.Mocked<Partial<ClientKafka>>;
  let WorkflowExecutionDomainMock: jest.Mocked<
    Partial<WorkflowExecutionDomain>
  >;
  let configServiceMock: jest.Mocked<
    Partial<ConfigService<KafkaWorkflowExecutionRequestEnvironmentVariables>>
  >;
  //let kafkaContextMock: jest.Mocked<KafkaContext>;

  beforeEach(async () => {
    kafkaClientMock = {
      subscribeToResponseOf: jest.fn().mockReturnValue(null),
      connect: jest.fn(),
    };
    WorkflowExecutionDomainMock = {
      runNewWorkflowExecution: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn().mockReturnValue('KAFKA_TOPIC_WER'),
    };
    /* kafkaContextMock = {
      getMessage: jest.fn().mockReturnValue({ offset: '' }),
      getTopic: jest.fn(),
      getPartition: jest.fn(),
      getConsumer: jest.fn().mockReturnValue({
        commitOffsets: jest.fn(),
      }),
    } as any;
*/
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowExecutionRequestController],
      providers: [
        {
          provide: KafkaWorkflowExecutionRequestClient,
          useValue: kafkaClientMock,
        },
        {
          provide: WorkflowExecutionDomain,
          useValue: WorkflowExecutionDomainMock,
        },
        { provide: ConfigService, useValue: configServiceMock },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    controller = module.get<WorkflowExecutionRequestController>(
      WorkflowExecutionRequestController,
    );
  });

  describe('onModuleInit', () => {
    it('if connection to kafka is successful, it should end gracefully', async () => {
      jest
        .spyOn(kafkaClientMock, 'connect')
        .mockResolvedValueOnce({} as Producer);
      await expect(controller.onModuleInit()).resolves.not.toThrow();
    });

    it('if connection to kafka fails, it should throw an error', async () => {
      jest
        .spyOn(kafkaClientMock, 'connect')
        .mockRejectedValueOnce(new Error('Kafka connection error'));
      await expect(controller.onModuleInit()).rejects.toThrow(
        KafkaConnectionException,
      );
    });
  });

  describe('handleExecutionRequest', () => {
    it('should run a new workflow execution', async () => {
      jest
        .spyOn(WorkflowExecutionDomainMock, 'runNewWorkflowExecution')
        .mockResolvedValueOnce({ alreadyRun: false, couldRun: true });
      await expect(
        controller.handleExecutionRequest(
          executionRequestExample,
          //kafkaContextMock,
        ),
      ).resolves.not.toThrow();
    });

    it('should throw an error if the workflow execution could not be run', async () => {
      jest
        .spyOn(WorkflowExecutionDomainMock, 'runNewWorkflowExecution')
        .mockResolvedValueOnce({ alreadyRun: false, couldRun: false });
      await expect(
        controller.handleExecutionRequest(
          executionRequestExample,
          //kafkaContextMock,
        ),
      ).rejects.toThrow(CannotRunNewWorkflowExecutionException);
    });

    it('should log a warning if the workflow execution has already been runned', async () => {
      jest
        .spyOn(WorkflowExecutionDomainMock, 'runNewWorkflowExecution')
        .mockResolvedValueOnce({ alreadyRun: true, couldRun: false });
      const spy = jest.spyOn(controller['LOGGER'], 'warn');
      await controller.handleExecutionRequest(
        executionRequestExample,
        //kafkaContextMock,
      );
      expect(spy).toHaveBeenCalled();
    });

    it('should log a warning if the workflow execution has already been runned (couldRun = true)', async () => {
      jest
        .spyOn(WorkflowExecutionDomainMock, 'runNewWorkflowExecution')
        .mockResolvedValueOnce({ alreadyRun: true, couldRun: true });
      const spy = jest.spyOn(controller['LOGGER'], 'warn');
      await controller.handleExecutionRequest(
        executionRequestExample,
        //kafkaContextMock,
      );
      expect(spy).toHaveBeenCalled();
    });

    it('should log a message if the workflow execution was successfully processed', async () => {
      jest
        .spyOn(WorkflowExecutionDomainMock, 'runNewWorkflowExecution')
        .mockResolvedValueOnce({ alreadyRun: false, couldRun: true });
      const spy = jest.spyOn(controller['LOGGER'], 'log');
      await controller.handleExecutionRequest(
        executionRequestExample,
        //kafkaContextMock,
      );
      expect(spy).toHaveBeenCalled();
    });

    /*it('should commit the offset after processing the request', async () => {
      jest
        .spyOn(WorkflowExecutionDomainMock, 'runNewWorkflowExecution')
        .mockResolvedValueOnce({ alreadyRun: false, couldRun: true });
      const spy = jest.spyOn(kafkaContextMock.getConsumer(), 'commitOffsets');
      await controller.handleExecutionRequest(
        executionRequestExample,
        //kafkaContextMock,
      );
      expect(spy).toHaveBeenCalled();
    });*/
    /*
    it('should commit the offset after even the workflow execution has already been runned', async () => {
      jest
        .spyOn(WorkflowExecutionDomainMock, 'runNewWorkflowExecution')
        .mockResolvedValueOnce({ alreadyRun: true, couldRun: false });
      const spy = jest.spyOn(kafkaContextMock.getConsumer(), 'commitOffsets');
      await controller.handleExecutionRequest(
        executionRequestExample,
        //kafkaContextMock,
      );
      expect(spy).toHaveBeenCalled();
    });*/
  });
});
