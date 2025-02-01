import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';

@Injectable()
export class HealthCheckDomainImpl implements HealthCheckDomain {
  private readonly LOGGER = new Logger(HealthCheckDomainImpl.name);

  constructor() {}

  async check(): Promise<boolean> {
    // Chequear Kafka a Scheduler, ambas bases de datos y kafka a Workflow Manager
    return true;
  }
}
