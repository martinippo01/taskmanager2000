import DeadTaskServiceException from '@exceptions/DeadTaskServiceException';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { HeartPingPath } from '@shared/HeartbeatPaths';
import { TracerGateway } from '@shared/TracerGateway';

@Controller(HeartPingPath)
class PingController {
  private readonly LOGGER = new Logger(PingController.name);

  constructor(
    @Inject(HealthCheckDomain)
    private readonly healthCheckDomain: HealthCheckDomain,
    @Inject(TracerGateway)
    private readonly tracerGateway: TracerGateway,
  ) {}

  @Get('')
  async ping(): Promise<`pong`> {
    return this.tracerGateway.trace<`pong`>(
      'PingController.ping',
      async (span) => {
        try {
          const isAlive = await this.healthCheckDomain.check();
          span.setAttribute('ping.isAlive', isAlive);
          if (!isAlive) {
            throw 'Task service is dead';
          }
        } catch (error) {
          span.addEvent('Task service is dead');
          this.LOGGER.error(`Health check error: ${error}`);
          throw new DeadTaskServiceException();
        }
        return 'pong' as const;
      },
    );
  }
}

export default PingController;
