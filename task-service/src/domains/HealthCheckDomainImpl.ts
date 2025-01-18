import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { TaskAgentDaoClient } from '@interfaces/repositories/TaskAgentDaoClient';
import { Inject, Logger } from '@nestjs/common';
import * as NodeCache from 'node-cache';

class HealthCheckDomainImpl implements HealthCheckDomain {
  private readonly cache: NodeCache;
  private readonly LOGGER = new Logger(HealthCheckDomainImpl.name);
  private readonly key = 'health-check';

  constructor(
    @Inject(TaskAgentDaoClient)
    private readonly taskAgentDaoClient: TaskAgentDaoClient,
  ) {
    const cacheTtl = parseInt(process.env.HC_CACHE_TTL || '300', 10);
    this.cache = new NodeCache({ stdTTL: cacheTtl });
  }

  async check(): Promise<boolean> {
    const cachedResult = this.cache.get<boolean>(this.key);
    if (cachedResult) {
      return cachedResult;
    }

    let result = true;
    try {
      await this.taskAgentDaoClient.ping();
    } catch (error) {
      this.LOGGER.error(`TaskAgentDaoClient connection error: ${error}`);
      result = false;
    }

    this.cache.set(this.key, result);

    return result;
  }
}

export default HealthCheckDomainImpl;
