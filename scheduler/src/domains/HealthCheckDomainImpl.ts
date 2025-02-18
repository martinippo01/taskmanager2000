import { Inject, Injectable, Logger } from '@nestjs/common';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class HealthCheckDomainImpl implements HealthCheckDomain {
  private readonly LOGGER = new Logger(HealthCheckDomainImpl.name);

  constructor(
    @Inject(TaskServiceGateway)
    private readonly taskServiceGateway: TaskServiceGateway,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  // Quizás tener en cuenta algo más? El kafka con el orquestador
  async check(): Promise<boolean> {
    return this.tracerGateway.trace('HealthCheckDomainImpl.check', () =>
      this.taskServiceGateway.pingTaskService(),
    );
  }
}
