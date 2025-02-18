import { Inject, Injectable, Logger } from '@nestjs/common';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class HealthCheckDomainImpl implements HealthCheckDomain {
  private readonly LOGGER = new Logger(HealthCheckDomainImpl.name);

  constructor(
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async check(): Promise<boolean> {
    return this.tracerGateway.trace('HealthCheckDomainImpl.check', async () => {
      // Chequear Kafka a Scheduler, ambas bases de datos y kafka a Workflow Manager
      return true;
    });
  }
}
