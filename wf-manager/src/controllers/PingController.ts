import NotAliveException from '@exceptions/NotAliveException';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { HeartPingPath } from '@shared/HeartbeatPaths';

@Controller(HeartPingPath)
class PingController {
  private readonly LOGGER = new Logger(PingController.name);

  constructor(
    @Inject(HealthCheckDomain)
    private readonly healthCheckDomain: HealthCheckDomain,
  ) {}

  @Get()
  async healthCheck() {
    const healthStatus = await this.healthCheckDomain.check();
    if (healthStatus.status === 'error') throw new NotAliveException();
    return healthStatus;
  }
}

export default PingController;
