import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { TaskServiceGatewayImpl } from '@gateways/TaskServiceGatewayImpl';

describe('TaskServiceGatewayImpl', () => {
  let service: TaskServiceGatewayImpl;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskServiceGatewayImpl,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskServiceGatewayImpl>(TaskServiceGatewayImpl);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('confirmTaskExists', () => {
    it('should return true if task exists', async () => {
      const taskId = '123';
      const response: AxiosResponse<boolean> = {
        data: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      const result = await service.confirmTaskExists(taskId);
      expect(result).toBe(true);
    });

    it('should return false if task does not exist', async () => {
      const taskId = '123';
      const response: AxiosResponse<void> = {
        data: undefined,
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      const result = await service.confirmTaskExists(taskId);
      expect(result).toBe(false);
    });

    it('should return false if an error occurs', async () => {
      const taskId = '123';
      jest.spyOn(httpService, 'get').mockReturnValueOnce(throwError('error'));

      const result = await service.confirmTaskExists(taskId);
      expect(result).toBe(false);
    });
  });

  describe('getTaskQueue', () => {
    it('should return the task queue', async () => {
      const taskId = '123';
      const response: AxiosResponse<string> = {
        data: 'queue1',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      const result = await service.getTaskQueue(taskId);
      expect(result).toBe('queue1');
    });

    it('should throw an error if task queue cannot be retrieved', async () => {
      const taskId = '123';
      jest.spyOn(httpService, 'get').mockReturnValueOnce(throwError('error'));

      await expect(service.getTaskQueue(taskId)).rejects.toThrow(
        'Failed to retrieve task queue',
      );
    });
  });

  describe('pingTaskService', () => {
    it('should return true if task service is healthy', async () => {
      const response: AxiosResponse<boolean> = {
        data: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response));

      const result = await service.pingTaskService();
      expect(result).toBe(true);
    });

    it('should return false if task service is not healthy', async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce(throwError('error'));

      const result = await service.pingTaskService();
      expect(result).toBe(false);
    });
  });
});
