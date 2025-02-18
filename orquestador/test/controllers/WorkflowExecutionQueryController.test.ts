import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowExecutionQueryController } from '../../src/controllers/WorkflowExecutionQueryController';
import { WorkflowExecutionQueryDomain } from '@interfaces/domains/WorklowExecutionQueryDomain';
import WorkflowExecutionNotFoundException from '@exceptions/WorkflowExecutionNotFoundException';
import CannotGetStepDataByExecutionId from '@exceptions/CannotGetStepDataByExecutionId';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import { WorkflowExecution } from '@repositories/entities/worflow-execution.entity';
import { Step } from '@shared/WorkflowPlan';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('WorkflowExecutionQueryController', () => {
  let controller: WorkflowExecutionQueryController;
  let workflowExecutionQueryDomain: WorkflowExecutionQueryDomain;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowExecutionQueryController],
      providers: [
        {
          provide: WorkflowExecutionQueryDomain,
          useValue: {
            getWorkflowExecutionByExecutionId: jest.fn(),
            getStepDataByExecutionId: jest.fn(),
            listExecutionIdsByWorkflowName: jest.fn(),
            listExecutionIds: jest.fn(),
          },
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);
    controller = module.get<WorkflowExecutionQueryController>(
      WorkflowExecutionQueryController,
    );
    workflowExecutionQueryDomain = module.get<WorkflowExecutionQueryDomain>(
      WorkflowExecutionQueryDomain,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWorkflowExecution', () => {
    it('should return workflow execution', async () => {
      const executionId = '1';
      const execution = { executionId: executionId } as WorkflowExecution;
      jest
        .spyOn(
          workflowExecutionQueryDomain,
          'getWorkflowExecutionByExecutionId',
        )
        .mockResolvedValue(execution);

      const result = await controller.getWorkflowExecution(executionId);
      expect(result).toEqual(execution);
    });

    it('should throw WorkflowExecutionNotFoundException if execution not found', async () => {
      const executionId = '1';
      jest
        .spyOn(
          workflowExecutionQueryDomain,
          'getWorkflowExecutionByExecutionId',
        )
        .mockResolvedValue(null);

      await expect(
        controller.getWorkflowExecution(executionId),
      ).rejects.toThrow(WorkflowExecutionNotFoundException);
    });
  });

  describe('getStepData', () => {
    it('should return step data', async () => {
      const executionId = '1';
      const stepNum = 1;
      const stepData = {
        name: 'stepName',
        task: 'taskName',
        params: {},
      } as Step;
      jest
        .spyOn(workflowExecutionQueryDomain, 'getStepDataByExecutionId')
        .mockResolvedValue(stepData);

      const result = await controller.getStepData(executionId, stepNum);
      expect(result).toEqual(stepData);
    });

    it('should throw CannotGetStepDataByExecutionId if step data not found', async () => {
      const executionId = '1';
      const stepNum = 1;
      jest
        .spyOn(workflowExecutionQueryDomain, 'getStepDataByExecutionId')
        .mockRejectedValue(new Error('Step not found'));

      await expect(
        controller.getStepData(executionId, stepNum),
      ).rejects.toThrow(CannotGetStepDataByExecutionId);
    });
  });

  describe('getExecutionsIdsByName', () => {
    it('should return execution ids by workflow name', async () => {
      const workflowName = 'testWorkflow1';
      const executionIds = ['1', '2'];
      jest
        .spyOn(workflowExecutionQueryDomain, 'listExecutionIdsByWorkflowName')
        .mockResolvedValue(executionIds);

      const result = await controller.getExecutionsIdsByName(workflowName);
      expect(result).toEqual(executionIds);
    });

    it('should throw WorkflowNotFoundException if no executions found for workflow name', async () => {
      const workflowName = 'testWorkflow2';
      jest
        .spyOn(workflowExecutionQueryDomain, 'listExecutionIdsByWorkflowName')
        .mockResolvedValue(null);

      await expect(
        controller.getExecutionsIdsByName(workflowName),
      ).rejects.toThrow(WorkflowNotFoundException);
    });

    it('should return all execution ids if no workflow name provided', async () => {
      const executionIds = ['1', '2'];
      jest
        .spyOn(workflowExecutionQueryDomain, 'listExecutionIds')
        .mockResolvedValue(executionIds);

      const result = await controller.getExecutionsIdsByName('');
      expect(result).toEqual(executionIds);
    });
  });
});
