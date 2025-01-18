import DeadTaskServiceException from '@exceptions/DeadTaskServiceException';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { TaskServicePingPath } from '@shared/TaskServicePaths';

@Controller(TaskServicePingPath)
class PingController {
  private readonly LOGGER = new Logger(PingController.name);

  constructor(
    @Inject(HealthCheckDomain)
    private readonly healthCheckDomain: HealthCheckDomain,
  ) {}

  @Get('')
  async ping(): Promise<`pong`> {
    try {
      const isAlive = await this.healthCheckDomain.check();
      if (!isAlive) {
        throw 'Task service is dead';
      }
    } catch (error) {
      this.LOGGER.error(`Health check error: ${error}`);
      throw new DeadTaskServiceException();
    }
    return 'pong';
  }
}

export default PingController;
