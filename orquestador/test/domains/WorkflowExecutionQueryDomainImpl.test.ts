import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowExecutionQueryDomainImpl } from '../../src/domains/WorkflowExecutionQueryDomainImpl';
import {
  stepsInfo,
  WorkflowExecutionDao,
} from '../../src/interfaces/repository/WorkflowExecutionDao';
import { WorkflowExecution } from '../../src/repositories/entities/worflow-execution.entity';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('WorkflowExecutionQueryDomainImpl', () => {
  let service: WorkflowExecutionQueryDomainImpl;
  let workflowExecutionRepository: WorkflowExecutionDao;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowExecutionQueryDomainImpl,
        {
          provide: WorkflowExecutionDao,
          useValue: {
            getWorkflowExecutionById: jest.fn(),
            getStepsFromExecution: jest.fn(),
            getExecutionIdsByName: jest.fn(),
            getAllExecutionIds: jest.fn(),
          },
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    service = module.get<WorkflowExecutionQueryDomainImpl>(
      WorkflowExecutionQueryDomainImpl,
    );
    workflowExecutionRepository =
      module.get<WorkflowExecutionDao>(WorkflowExecutionDao);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWorkflowExecutionByExecutionId', () => {
    it('should return a workflow execution', async () => {
      const executionId = '123';
      const workflowExecution = new WorkflowExecution();
      jest
        .spyOn(workflowExecutionRepository, 'getWorkflowExecutionById')
        .mockResolvedValue(workflowExecution);

      const result =
        await service.getWorkflowExecutionByExecutionId(executionId);
      expect(result).toBe(workflowExecution);
    });

    it('should return null if workflow execution not found', async () => {
      const executionId = '123';
      jest
        .spyOn(workflowExecutionRepository, 'getWorkflowExecutionById')
        .mockResolvedValue(null);

      const result =
        await service.getWorkflowExecutionByExecutionId(executionId);
      expect(result).toBeNull();
    });
  });

  describe('getStepDataByExecutionId', () => {
    it('should return step data', async () => {
      const executionId = '123';
      const stepNumber = 1;
      const stepsInfo: stepsInfo = {
        steps: [
          { name: 'n1', task: 't1', params: [] },
          { name: 'n1', task: 't1', params: [] },
        ],
        lastRun: '',
        inputArguments: {},
      };
      jest
        .spyOn(workflowExecutionRepository, 'getStepsFromExecution')
        .mockResolvedValue(stepsInfo);

      const result = await service.getStepDataByExecutionId(
        executionId,
        stepNumber,
      );
      expect(result).toBe(stepsInfo.steps[stepNumber]);
    });

    it('should throw an error if execution not found', async () => {
      const executionId = '123';
      const stepNumber = 1;
      jest
        .spyOn(workflowExecutionRepository, 'getStepsFromExecution')
        .mockResolvedValue(null);

      await expect(
        service.getStepDataByExecutionId(executionId, stepNumber),
      ).rejects.toThrow(`Execution ${executionId} not found`);
    });

    it('should throw an error if step not found', async () => {
      const executionId = '123';
      const stepNumber = 2;
      const stepsInfo: stepsInfo = {
        steps: [{ name: 'n1', task: 't1', params: [] }],
        lastRun: '',
        inputArguments: {},
      };
      jest
        .spyOn(workflowExecutionRepository, 'getStepsFromExecution')
        .mockResolvedValue(stepsInfo);

      await expect(
        service.getStepDataByExecutionId(executionId, stepNumber),
      ).rejects.toThrow(
        `Step ${stepNumber} not found in execution ${executionId}`,
      );
    });
  });

  describe('listExecutionIdsByWorkflowName', () => {
    it('should return a list of execution ids', async () => {
      const workflowName = 'testWorkflow';
      const executionIds = ['123', '456'];
      jest
        .spyOn(workflowExecutionRepository, 'getExecutionIdsByName')
        .mockResolvedValue(executionIds);

      const result = await service.listExecutionIdsByWorkflowName(workflowName);
      expect(result).toBe(executionIds);
    });

    it('should return null if no execution ids found', async () => {
      const workflowName = 'testWorkflow';
      jest
        .spyOn(workflowExecutionRepository, 'getExecutionIdsByName')
        .mockResolvedValue(null);

      const result = await service.listExecutionIdsByWorkflowName(workflowName);
      expect(result).toBeNull();
    });
  });

  describe('listExecutionIds', () => {
    it('should return a list of all execution ids', async () => {
      const executionIds = ['123', '456'];
      jest
        .spyOn(workflowExecutionRepository, 'getAllExecutionIds')
        .mockResolvedValue(executionIds);

      const result = await service.listExecutionIds();
      expect(result).toBe(executionIds);
    });
  });
});
