import HealthCheckDomainImpl from '@domains/HealthCheckDomainImpl';
import { TaskAgentDaoClient } from '@interfaces/repositories/TaskAgentDaoClient';
import { Test } from '@nestjs/testing';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('HealthCheckDomainImpl', () => {
  let healthCheckService: HealthCheckDomainImpl;
  let taskAgentDaoClientMock: jest.Mocked<TaskAgentDaoClient>;

  beforeEach(async () => {
    taskAgentDaoClientMock = {
      getTaskData: jest.fn(),
      setTaskData: jest.fn(),
      ping: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        HealthCheckDomainImpl,
        { provide: TaskAgentDaoClient, useValue: taskAgentDaoClientMock },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    healthCheckService = module.get<HealthCheckDomainImpl>(
      HealthCheckDomainImpl,
    );
  });

  describe('check', () => {
    it('should return true if health check is successful', async () => {
      taskAgentDaoClientMock.ping.mockResolvedValue('PONG');

      const result = await healthCheckService.check();

      expect(result).toBe(true);
    });

    it('should return false if health check fails', async () => {
      taskAgentDaoClientMock.ping.mockRejectedValue(new Error('error'));

      const result = await healthCheckService.check();

      expect(result).toBe(false);
    });

    it('should cache the result of the health check', async () => {
      taskAgentDaoClientMock.ping.mockResolvedValue('PONG');

      await healthCheckService.check();
      await healthCheckService.check();

      expect(taskAgentDaoClientMock.ping).toHaveBeenCalledTimes(1);
    });

    it('should return cached result if available', async () => {
      taskAgentDaoClientMock.ping.mockResolvedValue('PONG');

      await healthCheckService.check();
      taskAgentDaoClientMock.ping.mockRejectedValue(new Error('error'));

      const result = await healthCheckService.check();

      expect(result).toBe(true);
    });
  });
});
