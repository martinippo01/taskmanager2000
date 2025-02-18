import { Injectable, Inject, Logger } from '@nestjs/common';
import * as NodeCache from 'node-cache';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import { WorkflowExecutionRequestProducer } from '@interfaces/types/WorkflowExecutionRequestProducer';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class HealthCheckDomainImpl implements HealthCheckDomain {
  private readonly cache: NodeCache;
  private readonly LOGGER = new Logger(HealthCheckDomainImpl.name);

  constructor(
    @Inject(RedisRepository)
    private readonly redisClient: RedisRepository,
    @Inject(WorkflowExecutionRequestProducer)
    private readonly kafkaProducer: WorkflowExecutionRequestProducer, // Inject Kafka producer
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {
    const cacheTtl = parseInt(process.env.HC_CACHE_TTL || '300', 10);
    this.cache = new NodeCache({ stdTTL: cacheTtl });
  }

  // Quizás hay que hacer algo con OnModuleInit
  async check(): Promise<{ status: string; details: any }> {
    return this.tracerGateway.trace(
      'HealthCheckDomainImpl.check',
      async (span) => {
        // Check cache first
        const cachedResult = this.cache.get<{ status: string; details: any }>(
          'health-check',
        );
        span.setAttribute('cache.hit', cachedResult ? 'true' : 'false');
        if (cachedResult) return cachedResult;

        // Initialize health check result
        const result = {
          status: 'ok',
          details: {
            redis: false,
            kafka: false,
          },
        };

        // Check Redis
        try {
          if (await this.redisClient.ping()) {
            result.details.redis = true;
            this.LOGGER.log('Checking redis HC, result: Positive!');
          } else {
            result.status = 'error';
          }
        } catch (error) {
          this.LOGGER.error(`Connection error: ${error}`);
          result.status = 'error';
        }

        // Check Kafka
        if (this.kafkaProducer.isConnected()) {
          result.details.kafka = true;
          this.LOGGER.log('Checking kafka HC, result: Positive!');
        } else {
          result.status = 'error';
          this.LOGGER.error('Connection error with Kafka');
        }

        // Cache the result
        this.cache.set('health-check', result);
        span.setAttribute('health-check.status', result.status);
        span.setAttribute('health-check.redis', result.details.redis);
        span.setAttribute('health-check.kafka', result.details.kafka);

        return result;
      },
    );
  }
}
