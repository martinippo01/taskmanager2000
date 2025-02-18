import TaskServiceDomainImpl from '@domains/TaskServiceDomainImpl';
import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { Test } from '@nestjs/testing';
import { TaskData } from '@shared/TaskData';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('TaskServiceDomainImpl', () => {
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

  let taskAgentDaoMock: jest.Mocked<TaskAgentDao>;
  let taskServiceDomain: TaskServiceDomainImpl;

  beforeEach(async () => {
    taskAgentDaoMock = {
      getTaskData: jest.fn(),
      registerTask: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TaskServiceDomainImpl,
        { provide: TaskAgentDao, useValue: taskAgentDaoMock },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    taskServiceDomain = module.get<TaskServiceDomainImpl>(
      TaskServiceDomainImpl,
    );
  });

  describe('getTaskData', () => {
    it('should return task data', async () => {
      taskAgentDaoMock.getTaskData.mockResolvedValue(taskDataExample);

      const result = await taskServiceDomain.getTaskData('taskName');

      expect(result).toEqual(taskDataExample);
    });

    it('should return null if task data is not found', async () => {
      taskAgentDaoMock.getTaskData.mockResolvedValue(null);

      const result = await taskServiceDomain.getTaskData('taskName');

      expect(result).toBeNull();
    });
  });

  describe('registerTask', () => {
    it('should register a new task agent', async () => {
      taskAgentDaoMock.registerTask.mockResolvedValue({
        registered: true,
        updated: false,
      });

      const result = await taskServiceDomain.registerTask(
        'taskName',
        taskDataExample,
      );

      expect(result).toEqual({ registered: true, updated: false });
    });

    it('should update an existing task agent', async () => {
      taskAgentDaoMock.registerTask.mockResolvedValue({
        registered: false,
        updated: true,
      });

      const result = await taskServiceDomain.registerTask(
        'taskName',
        taskDataExample,
      );

      expect(result).toEqual({ registered: false, updated: true });
    });
  });
});
