import { Inject, Injectable, Logger } from '@nestjs/common';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';

@Injectable()
export class HealthCheckDomainImpl implements HealthCheckDomain {
  private readonly LOGGER = new Logger(HealthCheckDomainImpl.name);

  constructor(
    @Inject(TaskServiceGateway)
    private readonly taskServiceGateway: TaskServiceGateway,
  ) {}

  // Quizás tener en cuenta algo más? El kafka con el orquestador
  async check(): Promise<boolean> {
    return this.taskServiceGateway.pingTaskService();
  }
}
