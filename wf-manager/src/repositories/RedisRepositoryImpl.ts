import { FactoryProvider, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import { RedisRepository } from '@interfaces/repositories/RedisRepository';

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
  constructor(@Inject('RedisClient') private readonly redisClient: Redis) {}
  private readonly LOGGER = new Logger(RedisRepositoryImpl.name);

  onModuleInit(): void {}

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async setWithExpiry(
    key: string,
    value: string,
    expiry: number,
  ): Promise<void> {
    await this.redisClient.set(key, value, 'EX', expiry);
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.redisClient.ping();
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
  }
}
