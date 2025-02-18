import PingController from '@controllers/PingController';
import DeadTaskServiceException from '@exceptions/DeadTaskServiceException';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { Test } from '@nestjs/testing';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('PingController', () => {
  let pingController: PingController;
  let healthCheckDomainMock: jest.Mocked<HealthCheckDomain>;

  beforeEach(async () => {
    healthCheckDomainMock = {
      check: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [PingController],
      providers: [
        {
          provide: HealthCheckDomain,
          useValue: healthCheckDomainMock,
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    pingController = module.get(PingController);
  });

  describe('ping', () => {
    it('should return pong if health check is successful', async () => {
      healthCheckDomainMock.check.mockResolvedValue(true);

      const result = await pingController.ping();

      expect(result).toBe('pong');
    });

    it('should throw a DeadTaskServiceException if health check fails', async () => {
      healthCheckDomainMock.check.mockResolvedValue(false);

      await expect(pingController.ping()).rejects.toThrow(
        DeadTaskServiceException,
      );
    });

    it('should throw a DeadTaskServiceException if health check throws an error', async () => {
      healthCheckDomainMock.check.mockRejectedValue(new Error('error'));

      await expect(pingController.ping()).rejects.toThrow(
        DeadTaskServiceException,
      );
    });
  });
});
