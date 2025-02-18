import { FactoryProvider, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import {
  RedisMultiCommand,
  RedisRepository,
} from '@interfaces/repositories/RedisRepository';
import { TracerGateway } from '@shared/TracerGateway';

export const redisClientFactory: FactoryProvider<Redis> = {
  provide: 'RedisClient',
  useFactory: () => {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;

    if (!host || !port) {
      throw new Error('Redis host and port are required');
    }

    const redisInstance = new Redis({
      host,
      port: parseInt(port),
    });

    redisInstance.on('error', (e) => {
      throw new Error(`Redis connection failed: ${e}`);
    });

    return redisInstance;
  },
  inject: [],
};

@Injectable()
export class RedisRepositoryImpl implements OnModuleDestroy, RedisRepository {
  constructor(
    @Inject('RedisClient') private readonly redisClient: Redis,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}
  private readonly LOGGER = new Logger(RedisRepositoryImpl.name);

  onModuleInit(): void {}

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.tracerGateway.trace('RedisRepositoryImpl.get', async (span) => {
      span.setAttribute('redis.key', key);
      const value = await this.redisClient.get(key);
      span.setAttribute('redis.response.ok', true);
      return value;
    });
  }

  async set(key: string, value: string): Promise<void> {
    return this.tracerGateway.trace('RedisRepositoryImpl.set', async (span) => {
      span.setAttribute('redis.key', key);
      await this.redisClient.set(key, value);
      span.setAttribute('redis.response.ok', true);
    });
  }

  async delete(key: string): Promise<void> {
    return this.tracerGateway.trace(
      'RedisRepositoryImpl.delete',
      async (span) => {
        span.setAttribute('redis.key', key);
        await this.redisClient.del(key);
        span.setAttribute('redis.response.ok', true);
      },
    );
  }

  async setWithExpiry(
    key: string,
    value: string,
    expiry: number,
  ): Promise<void> {
    return this.tracerGateway.trace(
      'RedisRepositoryImpl.setWithExpiry',
      async (span) => {
        span.setAttribute('redis.key', key);
        span.setAttribute('redis.expiry', expiry);
        await this.redisClient.set(key, value, 'EX', expiry);
        span.setAttribute('redis.response.ok', true);
      },
    );
  }

  async ping(): Promise<boolean> {
    return this.tracerGateway.trace(
      'RedisRepositoryImpl.ping',
      async (span) => {
        try {
          const response = await this.redisClient.ping();
          span.setAttribute('redis.response', response);
          if (response === 'PONG') {
            this.LOGGER.log('Redis ping successful');
            return true;
          }
          this.LOGGER.error(`Unexpected Redis ping response: ${response}`);
          return false;
        } catch (error) {
          this.LOGGER.error(`Redis ping failed: ${error.message}`);
          return false;
        }
      },
    );
  }

  async sadd(key: string, value: string): Promise<void> {
    return this.tracerGateway.trace(
      'RedisRepositoryImpl.sadd',
      async (span) => {
        span.setAttribute('redis.key', key);
        await this.redisClient.sadd(key, value);
        span.setAttribute('redis.response.ok', true);
      },
    );
  }

  async sIsMember(key: string, value: string): Promise<boolean> {
    return this.tracerGateway.trace(
      'RedisRepositoryImpl.sIsMember',
      async (span) => {
        span.setAttribute('redis.key', key);
        const response = await this.redisClient.sismember(key, value);
        span.setAttribute('redis.response', response);
        return response === 1;
      },
    );
  }

  async multi(commands: RedisMultiCommand[]): Promise<void> {
    return this.tracerGateway.trace(
      'RedisRepositoryImpl.multi',
      async (span) => {
        span.setAttribute('redis.commands.length', commands.length);
        await this.redisClient.multi(commands).exec((err) => {
          if (err) {
            throw new Error(`Failed to execute multi command: ${err}`);
          }
        });
        span.setAttribute('redis.response.ok', true);
      },
    );
  }
}
