import { Test } from '@nestjs/testing';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import WorkflowDaoImpl from '@repositories/WorkflowDaoImpl';
import { Workflow } from '@interfaces/types/Workflow';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('WorkflowDao', () => {
  const redisRepositoryMock = {
    get: jest.fn(),
    set: jest.fn(),
    sadd: jest.fn(),
    sIsMember: jest.fn(),
    delete: jest.fn(),
    setWithExpiry: jest.fn(),
    ping: jest.fn(),
    multi: jest.fn(),
  };

  let workflowDao: WorkflowDao;
  let redisRepository: RedisRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RedisRepository,
          useValue: redisRepositoryMock,
        },
        {
          provide: WorkflowDao,
          useClass: WorkflowDaoImpl,
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    moduleRef.useLogger(false);
    workflowDao = moduleRef.get<WorkflowDao>(WorkflowDao);
    redisRepository = moduleRef.get<RedisRepository>(RedisRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(workflowDao).toBeDefined();
  });

  describe('addWorkflow', () => {
    it('should add a workflow', async () => {
      const workflow: Workflow = {
        name: 'workflow',
        version: '1.0',
        description: 'description',
        inputParams: {},
        plan: { steps: [] },
        enabled: true,
      };

      await workflowDao.createWorkflow(workflow);

      expect(redisRepository.multi).toHaveBeenCalledWith([
        ['set', `WORKFLOW:LATEST`, workflow.version],
        [
          'set',
          `${workflow.name.toUpperCase()}:${workflow.version.toUpperCase()}:PLAN`,
          JSON.stringify(workflow.plan),
        ],
        [
          'set',
          `${workflow.name.toUpperCase()}:${workflow.version.toUpperCase()}:METADATA`,
          JSON.stringify({
            name: workflow.name,
            version: workflow.version,
            description: workflow.description,
            inputParams: workflow.inputParams,
            enabled: workflow.enabled,
          }),
        ],
        ['sadd', 'WORKFLOWS', workflow.name],
        [
          'sadd',
          `WORKFLOW:${workflow.name.toUpperCase()}:VERSIONS`,
          workflow.version,
        ],
      ]);
    });
  });

  describe('getWorkflow', () => {
    it('should get a workflow', async () => {
      const name = 'workflow';
      const version = '1.0';
      const workflow: Workflow = {
        name,
        version,
        description: 'description',
        inputParams: {},
        plan: { steps: [] },
        enabled: true,
      };

      jest.spyOn(redisRepository, 'get').mockImplementation((key: string) => {
        if (key === `${name.toUpperCase()}:${version.toUpperCase()}:METADATA`) {
          return Promise.resolve(
            JSON.stringify({
              name: workflow.name,
              version: workflow.version,
              description: workflow.description,
              inputParams: workflow.inputParams,
              enabled: workflow.enabled,
            }),
          );
        } else if (
          key === `${name.toUpperCase()}:${version.toUpperCase()}:PLAN`
        ) {
          return Promise.resolve(JSON.stringify(workflow.plan));
        }
        return Promise.resolve(null);
      });

      const result = await workflowDao.getWorkflow(name, version);

      expect(result).toEqual(workflow);
      expect(redisRepository.get).toHaveBeenCalledWith(
        `${name.toUpperCase()}:${version.toUpperCase()}:METADATA`,
      );
      expect(redisRepository.get).toHaveBeenCalledWith(
        `${name.toUpperCase()}:${version.toUpperCase()}:PLAN`,
      );
    });

    it('should throw an error if workflow does not exist', async () => {
      const name = 'workflow';
      const version = '1.0';
      jest.spyOn(redisRepository, 'get').mockImplementation(() => {
        throw new Error('Workflow not found');
      });

      await expect(workflowDao.getWorkflow(name, version)).rejects.toThrow();
    });

    it('should throw an error if the workflow is not a valid JSON', async () => {
      const workflowId = 'workflowId';
      jest.spyOn(redisRepository, 'get').mockResolvedValue('invalid-json');

      await expect(workflowDao.getWorkflow(workflowId)).rejects.toThrow();
    });
  });
});
