import NotAliveException from '@exceptions/NotAliveException';
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

  @Get()
  async healthCheck() {
    return this.tracerGateway.trace(
      'PingController.healthCheck',
      async (span) => {
        const healthStatus = await this.healthCheckDomain.check();
        span.setAttribute('healthy', healthStatus.status === 'ok');
        if (healthStatus.status === 'error') {
          span.addEvent('Microservice not alive!');
          throw new NotAliveException();
        }
        return healthStatus;
      },
    );
  }
}

export default PingController;
