import { FactoryProvider } from '@nestjs/common';
import Redis from 'ioredis';

export const TaskAgentDaoClient = Symbol('TaskAgentDaoClient');

export type TaskAgentDaoClient = Redis;

export const taskAgentDaoClientUseFactory: FactoryProvider<TaskAgentDaoClient>['useFactory'] =
  () => {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;

    if (!host) {
      throw new Error('Redis host is required');
    }
    if (!port) {
      throw new Error('Redis port is required');
    }

    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber)) {
      throw new Error('Redis port must be a number');
    }

    return new Redis({
      host,
      port: portNumber,
    });
  };
