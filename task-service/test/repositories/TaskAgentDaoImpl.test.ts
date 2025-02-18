import TaskAgentDaoClientException from '@exceptions/TaskAgentDaoClientException';
import { TaskAgentDaoClient } from '@interfaces/repositories/TaskAgentDaoClient';
import { Test } from '@nestjs/testing';
import TaskAgentDaoImpl from '@repositories/TaskAgentDaoImpl';
import { TaskData } from '@shared/TaskData';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('TaskAgentDaoImpl', () => {
  const taskDataExample: TaskData = {
    kafka: {
      brokers: 'localhost:9092',
      topic: 'topic',
      username: 'username',
      password: 'pass',
    },
    params: {
      param1: 'string',
      param2: 'number',
    },
    optionalParams: ['param2'],
  };

  let taskAgentDao: TaskAgentDaoImpl;
  let taskAgentDaoClientMock: jest.Mocked<TaskAgentDaoClient>;

  beforeEach(async () => {
    taskAgentDaoClientMock = {
      getTaskData: jest.fn(),
      setTaskData: jest.fn(),
      ping: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TaskAgentDaoImpl,
        { provide: TaskAgentDaoClient, useValue: taskAgentDaoClientMock },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    taskAgentDao = module.get<TaskAgentDaoImpl>(TaskAgentDaoImpl);
  });

  describe('getTaskData', () => {
    it('should return task data', async () => {
      taskAgentDaoClientMock.getTaskData.mockResolvedValue(taskDataExample);

      const result = await taskAgentDao.getTaskData('taskName');

      expect(result).toEqual(taskDataExample);
    });

    it('should return null if task data is not found', async () => {
      taskAgentDaoClientMock.getTaskData.mockResolvedValue(null);

      const result = await taskAgentDao.getTaskData('taskName');

      expect(result).toBeNull();
    });

    it('should throw an error if task data is invalid', async () => {
      taskAgentDaoClientMock.getTaskData.mockResolvedValue({ invalid: 'data' });

      await expect(taskAgentDao.getTaskData('taskName')).rejects.toThrow(
        TaskAgentDaoClientException,
      );
      taskAgentDao.getTaskData('taskName').catch((e) => {
        expect(e.message).toBe('Invalid task data format');
      });
    });

    it('should throw an error if task data is not an object', async () => {
      taskAgentDaoClientMock.getTaskData.mockResolvedValue('invalid data');

      await expect(taskAgentDao.getTaskData('taskName')).rejects.toThrow(
        TaskAgentDaoClientException,
      );
      taskAgentDao.getTaskData('taskName').catch((e) => {
        expect(e.message).toBe('Invalid task data format');
      });
    });

    it('if client throws an error, should throw a TaskAgentDaoClientException', async () => {
      taskAgentDaoClientMock.getTaskData.mockRejectedValue(new Error('error'));

      await expect(taskAgentDao.getTaskData('taskName')).rejects.toThrow(
        TaskAgentDaoClientException,
      );
      taskAgentDao.getTaskData('taskName').catch((e) => {
        expect(e.message).toBe('Error getting task data for task taskName');
      });
    });
  });

  describe('registerTask', () => {
    it('should register a new task agent', async () => {
      taskAgentDaoClientMock.getTaskData.mockResolvedValue(null);
      taskAgentDaoClientMock.setTaskData.mockResolvedValue(undefined);

      const result = await taskAgentDao.registerTask(
        'taskName',
        taskDataExample,
      );

      expect(result).toEqual({ registered: true, updated: false });
    });

    it('should update an existing task agent', async () => {
      taskAgentDaoClientMock.getTaskData.mockResolvedValue(taskDataExample);
      taskAgentDaoClientMock.setTaskData.mockResolvedValue(undefined);

      const result = await taskAgentDao.registerTask(
        'taskName',
        taskDataExample,
      );

      expect(result).toEqual({ registered: false, updated: true });
    });

    it('if client throws an error, should throw a TaskAgentDaoClientException', async () => {
      taskAgentDaoClientMock.getTaskData.mockRejectedValue(new Error('error'));

      await expect(
        taskAgentDao.registerTask('taskName', taskDataExample),
      ).rejects.toThrow(TaskAgentDaoClientException);
      taskAgentDao.registerTask('taskName', taskDataExample).catch((e) => {
        expect(e.message).toBe(
          'Error registering task agent for task taskName',
        );
      });
    });

    it('if client throws an error, should throw a TaskAgentDaoClientException', async () => {
      taskAgentDaoClientMock.getTaskData.mockResolvedValue(taskDataExample);
      taskAgentDaoClientMock.setTaskData.mockRejectedValue(new Error('error'));

      await expect(
        taskAgentDao.registerTask('taskName', taskDataExample),
      ).rejects.toThrow(TaskAgentDaoClientException);
      taskAgentDao.registerTask('taskName', taskDataExample).catch((e) => {
        expect(e.message).toBe(
          'Error registering task agent for task taskName',
        );
      });
    });
  });
});
