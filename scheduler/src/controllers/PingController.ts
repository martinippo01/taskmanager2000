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
    const resp = this.healthCheckDomain.check();
    if (!resp) {
      this.LOGGER.error('Microservice not alive!');
      throw new NotAliveException();
    }
    return resp;
  }
}

export default PingController;
