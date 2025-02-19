import TaskAgentController from '@controllers/TaskAgentController';
import TaskAgentNotFoundException from '@exceptions/TaskAgentNotFoundException';
import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import { TaskAgentRegisterRequestDto } from '@interfaces/types/TaskAgentRegister';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskData } from '@shared/TaskData';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('TaskAgentController', () => {
  const taskDataExample: TaskData = {
    kafka: {
      brokers: 'localhost:9092',
      username: 'user',
      password: 'password',
      topic: 'topic',
    },
    params: {
      param1: 'string',
      param2: 'number',
    },
    optionalParams: ['param2'],
  };

  let controller: TaskAgentController;
  let taskServiceDomainMock: jest.Mocked<TaskServiceDomain>;

  beforeEach(async () => {
    taskServiceDomainMock = {
      getTaskData: jest.fn(),
      registerTask: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskAgentController],
      providers: [
        { provide: TaskServiceDomain, useValue: taskServiceDomainMock },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    controller = module.get<TaskAgentController>(TaskAgentController);
  });

  describe('getTaskData', () => {
    it('should return task data', async () => {
      taskServiceDomainMock.getTaskData.mockResolvedValue(taskDataExample);

      const result = await controller.getTaskData('taskName');

      expect(result).toEqual(taskDataExample);
    });

    it('should throw an error if task data is not found', async () => {
      taskServiceDomainMock.getTaskData.mockResolvedValue(null);

      await expect(controller.getTaskData('taskName')).rejects.toThrow(
        TaskAgentNotFoundException,
      );
    });
  });

  describe('registerTaskAgent', () => {
    it('should register a new task agent', async () => {
      taskServiceDomainMock.registerTask.mockResolvedValue({
        registered: true,
        updated: false,
      });

      const result = await controller.registerTaskAgent('taskName', {
        kafkaData: taskDataExample.kafka,
        params: taskDataExample.params,
        optionalParams: taskDataExample.optionalParams,
      });

      expect(result).toEqual({ registered: true, updated: false });
    });

    it('should update an existing task agent', async () => {
      taskServiceDomainMock.registerTask.mockResolvedValue({
        registered: false,
        updated: true,
      });

      const result = await controller.registerTaskAgent('taskName', {
        kafkaData: taskDataExample.kafka,
        params: taskDataExample.params,
        optionalParams: taskDataExample.optionalParams,
      });

      expect(result).toEqual({ registered: false, updated: true });
    });

    it('should throw an error if kafka data is invalid', async () => {
      const invalidKafkaData = {
        brokers: 'localhost:9092',
        topic: 'topic',
      };
      const dtoObject = plainToInstance(TaskAgentRegisterRequestDto, {
        kafkaData: invalidKafkaData,
        params: taskDataExample.params,
        optionalParams: taskDataExample.optionalParams,
      });
      const errors = await validate(dtoObject);
      expect(errors.length).toBeGreaterThan(0);
      const errorsStr = JSON.stringify(errors);
      expect(errorsStr).toContain(
        'Kafka data must be an object with the following properties: brokers, username, password, topic',
      );
    });

    it('should throw an error if input params are invalid', async () => {
      const invalidParams = {
        param1: 'float',
      };
      const dtoObject = plainToInstance(TaskAgentRegisterRequestDto, {
        kafkaData: taskDataExample.kafka,
        params: invalidParams,
        optionalParams: taskDataExample.optionalParams,
      });
      const errors = await validate(dtoObject);
      expect(errors.length).toBeGreaterThan(0);
      const errorsStr = JSON.stringify(errors);
      expect(errorsStr).toContain(
        'Input parameters must be a record of strings representing the parameter types',
      );
    });

    it('should throw an error if optional params are invalid', async () => {
      const invalidOptionalParams = ['param3'];
      const dtoObject = plainToInstance(TaskAgentRegisterRequestDto, {
        kafkaData: taskDataExample.kafka,
        params: taskDataExample.params,
        optionalParams: invalidOptionalParams,
      });
      const errors = await validate(dtoObject);
      expect(errors.length).toBeGreaterThan(0);
      const errorsStr = JSON.stringify(errors);
      expect(errorsStr).toContain(
        "Optional parameters must be an array containing a subset of the input parameters' keys",
      );
    });
  });
});
