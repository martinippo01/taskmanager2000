import { Injectable, Inject, Logger } from '@nestjs/common';
import NodeCache from 'node-cache';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import { WorkflowExecutionRequestProducer } from '@interfaces/types/WorkflowExecutionRequestProducer';

@Injectable()
export class HealthCheckDominio {
  private readonly cache: NodeCache;
  private readonly LOGGER = new Logger(HealthCheckDominio.name);

  constructor(
    @Inject(RedisRepository)
    private readonly redisClient: RedisRepository,
    @Inject(WorkflowExecutionRequestProducer)
    private readonly kafkaProducer: WorkflowExecutionRequestProducer, // Inject Kafka producer
  ) {
    const cacheTtl = parseInt(process.env.HC_CACHE_TTL || '300', 10);
    this.cache = new NodeCache({ stdTTL: cacheTtl });
  }

  // Quizás hay que hacer algo con OnModuleInit
  async checkHealth(): Promise<{ status: string; details: any }> {
    // Check cache first
    const cachedResult = this.cache.get('health-check');
    if (cachedResult) return cachedResult as { status: string; details: any };

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

    try {
      await this.kafkaProducer.connect();
      result.details.kafka = true;
      this.LOGGER.log('Checking kafka HC, result: Positive!');
    } catch (error) {
      this.LOGGER.error(`Connection error with Kafka, exception: ${error}`);
      result.status = 'error';
    }

    // Cache the result
    this.cache.set('health-check', result);

    return result;
  }
}
