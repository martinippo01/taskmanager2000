import { TaskAgentDaoClient } from '@interfaces/repositories/TaskAgentDaoClient';
import { FactoryProvider } from '@nestjs/common';
import { TaskData } from '@shared/TaskData';
import Redis from 'ioredis';

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

    const redis = new Redis({
      host,
      port: portNumber,
    });

    return {
      getTaskData: async (taskName: string) => {
        const response = await redis.get(taskName);
        if (!response) {
          return null;
        }
        const parsed = JSON.parse(response);
        return parsed;
      },
      setTaskData: async (taskName: string, taskData: TaskData) => {
        const taskDataString = JSON.stringify(taskData);
        await redis.set(taskName, taskDataString);
      },
      ping: async () => {
        return redis.ping();
      },
    };
  };
