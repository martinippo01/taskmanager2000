import { FactoryProvider, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import { RedisRepository } from '@interfaces/repositories/RedisRepository';

export const redisClientFactory: FactoryProvider<Redis> = {
  provide: 'RedisClient',
  useFactory: () => {
    const redisInstance = new Redis({
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
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
}
