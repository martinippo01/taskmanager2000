import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestEnvironmentVariables,
} from '@configs/KafkaStepScheduleRequestConfig';
import KafkaConnectionException from '@exceptions/KakfaConnectionException';
import { StepScheduleRequestGatewayImpl } from '@gateways/StepScheduleRequestGatewayImpl';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('StepScheduleRequestGatewayImpl', () => {
  const topic = 'KAFKA_TOPIC_SSR';

  const stepScheduleRequestExample: StepScheduleRequest = {
    inputArgs: {},
    name: 'name',
    task: 'task',
    workflowExecutionId: 'workflowExecutionId',
  };

  let gateway: StepScheduleRequestGatewayImpl;
  let kafkaClientMock: jest.Mocked<Partial<ClientKafka>>;
  let configServiceMock: jest.Mocked<
    Partial<ConfigService<KafkaStepScheduleRequestEnvironmentVariables>>
  >;

  beforeEach(async () => {
    kafkaClientMock = {
      connect: jest.fn(),
      emit: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn().mockReturnValue(topic),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: StepScheduleRequestGateway,
          useClass: StepScheduleRequestGatewayImpl,
        },
        {
          provide: KafkaStepScheduleRequestClient,
          useValue: kafkaClientMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    gateway = module.get<StepScheduleRequestGatewayImpl>(
      StepScheduleRequestGateway,
    );
  });

  describe('onModuleInit', () => {
    it('should connect to kafka', async () => {
      jest.spyOn(kafkaClientMock, 'connect').mockResolvedValue({} as any);
      await gateway.onModuleInit();
      expect(kafkaClientMock.connect).toHaveBeenCalled();
    });

    it('should throw an exception if it fails to connect to kafka', async () => {
      jest
        .spyOn(kafkaClientMock, 'connect')
        .mockRejectedValue(new Error('connection error'));
      await expect(gateway.onModuleInit()).rejects.toThrow(
        KafkaConnectionException,
      );
    });
  });

  describe('queueStep', () => {
    it('should emit a step schedule request', async () => {
      jest.spyOn(kafkaClientMock, 'emit').mockReturnValue({
        subscribe: jest.fn().mockImplementation((callbacks) => {
          callbacks.complete();
        }),
      } as any);
      await gateway.queueStep(stepScheduleRequestExample);
      expect(kafkaClientMock.emit).toHaveBeenCalledWith(
        topic,
        stepScheduleRequestExample,
      );
    });

    it('should return a promise that resolves to true', async () => {
      jest.spyOn(kafkaClientMock, 'emit').mockImplementation(
        () =>
          ({
            subscribe: jest.fn().mockImplementation((callbacks) => {
              callbacks.complete();
            }),
          }) as any,
      );
      const result = gateway.queueStep(stepScheduleRequestExample);
      await expect(result).resolves.toStrictEqual({ queued: true });
    });

    it('should return a promise that rejects if the emit fails', async () => {
      const error = new Error('error');
      jest.spyOn(kafkaClientMock, 'emit').mockImplementation(
        () =>
          ({
            subscribe: jest.fn().mockImplementation((callbacks) => {
              callbacks.error(error);
            }),
          }) as any,
      );
      const result = gateway.queueStep(stepScheduleRequestExample);
      await expect(result).resolves.toStrictEqual({ queued: false, error });
    });
  });
});
