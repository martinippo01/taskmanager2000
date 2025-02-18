import { TaskAgentsGatewayImpl } from '@gateways/TaskAgentsGatewayImpl';
import { StepScheduleExceptionOrchestratorGateway } from '@interfaces/gateways/StepScheduleExceptionOrchestratorGateway';
import {
  TaskAgentGateway,
  TaskAgentGatewayProvider,
} from '@interfaces/gateways/TaskAgentGatewayProvider';
import { Test } from '@nestjs/testing';
import { StepScheduleException } from '@shared/StepScheduleException';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { KafkaTaskData, TaskData } from '@shared/TaskData';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('TaskAgentsGatewayImpl', () => {
  const kafkaTaskDataExample: KafkaTaskData = {
    brokers: 'brokers',
    username: 'username',
    password: 'password',
    topic: 'topic',
  };
  const taskDataExample: TaskData = {
    kafka: kafkaTaskDataExample,
    params: {},
    optionalParams: [],
  };
  const stepScheduleRequestExample: StepScheduleRequest = {
    inputArgs: {
      input: 'input',
    },
    name: 'name',
    task: 'task',
    workflowExecutionId: 'workflowExecutionId',
  };

  let gateway: TaskAgentsGatewayImpl;
  let stepScheduleExceptionOrchestratorGatewayMock: jest.Mocked<StepScheduleExceptionOrchestratorGateway>;
  let taskAgentGatewayProviderMock: jest.Mocked<TaskAgentGatewayProvider>;

  beforeEach(async () => {
    stepScheduleExceptionOrchestratorGatewayMock = {
      notify: jest.fn(),
    };
    taskAgentGatewayProviderMock = {
      provide: jest.fn(),
    };
    const testModule = await Test.createTestingModule({
      providers: [
        TaskAgentsGatewayImpl,
        {
          provide: StepScheduleExceptionOrchestratorGateway,
          useValue: stepScheduleExceptionOrchestratorGatewayMock,
        },
        {
          provide: TaskAgentGatewayProvider,
          useValue: taskAgentGatewayProviderMock,
        },
        tracerGatewayMockProvider,
      ],
    }).compile();
    testModule.useLogger(false);
    gateway = testModule.get<TaskAgentsGatewayImpl>(TaskAgentsGatewayImpl);
  });

  describe('onModuleDestroy', () => {
    it('should disconnect all task agents', async () => {
      const taskAgentGatewayExample: jest.Mocked<TaskAgentGateway> = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        send: jest.fn(),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      };
      jest
        .spyOn(taskAgentGatewayProviderMock, 'provide')
        .mockReturnValue(taskAgentGatewayExample);
      await gateway.sendStep(taskDataExample, stepScheduleRequestExample);
      gateway.onModuleDestroy();
      expect(taskAgentGatewayExample.disconnect).toHaveBeenCalled();
    });

    it('should handle error when disconnecting task agent', async () => {
      const taskAgentGatewayExample: jest.Mocked<TaskAgentGateway> = {
        connect: jest.fn(),
        disconnect: jest.fn().mockRejectedValue(new Error('error')),
        isConnected: jest.fn().mockReturnValue(true),
        send: jest.fn(),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      };
      jest
        .spyOn(taskAgentGatewayProviderMock, 'provide')
        .mockReturnValue(taskAgentGatewayExample);
      await gateway.sendStep(taskDataExample, stepScheduleRequestExample);
      await expect(gateway.onModuleDestroy()).resolves.not.toThrow();
      expect(taskAgentGatewayExample.disconnect).toHaveBeenCalled();
    });
  });

  describe('sendStep', () => {
    it('should send step successfully', async () => {
      const taskAgentGatewayExample: jest.Mocked<TaskAgentGateway> = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        send: jest.fn(),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      };
      jest
        .spyOn(taskAgentGatewayProviderMock, 'provide')
        .mockReturnValue(taskAgentGatewayExample);
      await expect(
        gateway.sendStep(taskDataExample, stepScheduleRequestExample),
      ).resolves.toEqual({ sent: true });
      expect(taskAgentGatewayExample.connect).not.toHaveBeenCalled();
    });

    it('should handle error when sending step', async () => {
      jest.spyOn(taskAgentGatewayProviderMock, 'provide').mockReturnValue({
        connect: jest.fn(),
        disconnect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        send: jest.fn().mockRejectedValue(new Error('error')),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      });
      await expect(
        gateway.sendStep(taskDataExample, stepScheduleRequestExample),
      ).resolves.toEqual({ sent: false });
      expect(
        stepScheduleExceptionOrchestratorGatewayMock.notify,
      ).toHaveBeenCalledWith(
        stepScheduleRequestExample,
        StepScheduleException.TASK_ERROR,
      );
    });

    it('should connect to task agent gateway if not connected', async () => {
      const taskAgentGatewayExample: jest.Mocked<TaskAgentGateway> = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(false),
        send: jest.fn(),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      };
      jest
        .spyOn(taskAgentGatewayProviderMock, 'provide')
        .mockReturnValue(taskAgentGatewayExample);
      await expect(
        gateway.sendStep(taskDataExample, stepScheduleRequestExample),
      ).resolves.toEqual({ sent: true });
      expect(taskAgentGatewayExample.connect).toHaveBeenCalled();
    });

    it('should handle error when connecting to task agent gateway', async () => {
      const taskAgentGatewayExample: jest.Mocked<TaskAgentGateway> = {
        connect: jest.fn().mockRejectedValue(new Error('error')),
        disconnect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(false),
        send: jest.fn(),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      };
      jest
        .spyOn(taskAgentGatewayProviderMock, 'provide')
        .mockReturnValue(taskAgentGatewayExample);
      await expect(
        gateway.sendStep(taskDataExample, stepScheduleRequestExample),
      ).resolves.toEqual({ sent: false });
      expect(taskAgentGatewayExample.connect).toHaveBeenCalled();
      expect(
        stepScheduleExceptionOrchestratorGatewayMock.notify,
      ).toHaveBeenCalledWith(
        stepScheduleRequestExample,
        StepScheduleException.TASK_ERROR,
      );
    });

    it('should reuse task agent gateway if already connected', async () => {
      const taskAgentGatewayExample: jest.Mocked<TaskAgentGateway> = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        send: jest.fn(),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      };
      jest
        .spyOn(taskAgentGatewayProviderMock, 'provide')
        .mockReturnValue(taskAgentGatewayExample);
      await gateway.sendStep(taskDataExample, stepScheduleRequestExample);
      await gateway.sendStep(taskDataExample, stepScheduleRequestExample);
      expect(taskAgentGatewayProviderMock.provide).toHaveBeenCalledTimes(1);
    });

    it('should handle error when reusing task agent gateway', async () => {
      const taskAgentGatewayExample: jest.Mocked<TaskAgentGateway> = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        send: jest.fn(),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      };
      jest
        .spyOn(taskAgentGatewayProviderMock, 'provide')
        .mockReturnValue(taskAgentGatewayExample);
      await expect(
        gateway.sendStep(taskDataExample, stepScheduleRequestExample),
      ).resolves.toEqual({ sent: true });
      jest
        .spyOn(taskAgentGatewayExample, 'send')
        .mockRejectedValue(new Error('error'));
      await expect(
        gateway.sendStep(taskDataExample, stepScheduleRequestExample),
      ).resolves.toEqual({ sent: false });
      expect(
        stepScheduleExceptionOrchestratorGatewayMock.notify,
      ).toHaveBeenCalledWith(
        stepScheduleRequestExample,
        StepScheduleException.TASK_ERROR,
      );
      expect(
        stepScheduleExceptionOrchestratorGatewayMock.notify,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle error when reusing task agent gateway and connecting', async () => {
      const taskAgentGatewayExample: jest.Mocked<TaskAgentGateway> = {
        connect: jest.fn().mockRejectedValue(new Error('error')),
        disconnect: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        send: jest.fn(),
        getKafkaConfig: jest.fn().mockReturnValue(kafkaTaskDataExample),
      };
      jest
        .spyOn(taskAgentGatewayProviderMock, 'provide')
        .mockReturnValue(taskAgentGatewayExample);
      await expect(
        gateway.sendStep(taskDataExample, stepScheduleRequestExample),
      ).resolves.toEqual({ sent: true });
      jest.spyOn(taskAgentGatewayExample, 'isConnected').mockReturnValue(false);
      await expect(
        gateway.sendStep(taskDataExample, stepScheduleRequestExample),
      ).resolves.toEqual({ sent: false });
      expect(
        stepScheduleExceptionOrchestratorGatewayMock.notify,
      ).toHaveBeenCalledWith(
        stepScheduleRequestExample,
        StepScheduleException.TASK_ERROR,
      );
      expect(
        stepScheduleExceptionOrchestratorGatewayMock.notify,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
