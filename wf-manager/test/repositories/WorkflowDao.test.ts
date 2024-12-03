import { Test } from '@nestjs/testing';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import {
  RedisMultiCommand,
  RedisRepository,
} from '@interfaces/repositories/RedisRepository';
import WorkflowDaoImpl from '@repositories/WorkflowDaoImpl';

describe('WorkflowDao', () => {
  class RedisRepositoryMock implements RedisRepository {
    set(key: string, value: string): Promise<void> {
      return Promise.resolve();
    }

    sadd(key: string, value: string): Promise<void> {
      return Promise.resolve();
    }

    sIsMember(key: string, value: string): Promise<boolean> {
      return Promise.resolve(true);
    }
    delete(key: string): Promise<void> {
      return Promise.resolve();
    }
    setWithExpiry(key: string, value: string, expiry: number): Promise<void> {
      return Promise.resolve();
    }
    ping(): Promise<boolean> {
      return Promise.resolve(true);
    }
    multi(commands: RedisMultiCommand[]): Promise<void> {
      throw new Error('Method not implemented.');
    }

    get(key: string): Promise<string | null> {
      return Promise.resolve(null);
    }
  }

  let workflowDao: WorkflowDao;
  let redisRepository: RedisRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RedisRepository,
          useClass: RedisRepositoryMock,
        },
        {
          provide: WorkflowDao,
          useClass: WorkflowDaoImpl,
        },
      ],
    }).compile();

    moduleRef.useLogger(false);
    workflowDao = moduleRef.get<WorkflowDao>(WorkflowDao);
    redisRepository = moduleRef.get<RedisRepository>(RedisRepository);
  });
});
