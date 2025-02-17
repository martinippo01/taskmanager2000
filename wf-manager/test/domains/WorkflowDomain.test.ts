import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain';
import WorkflowDomainImpl from '@domains/WorkflowDomainImpl';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { jest } from '@jest/globals';
import { Workflow } from '@interfaces/types/Workflow';
import WorkflowAlreadyExistsException from '@exceptions/WorkflowAlreadyExistsException';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('WorkflowDomainImpl', () => {
  let workflowDomain: WorkflowDomain;
  let workflowDao: jest.Mocked<WorkflowDao>;
  let workflowPlanDomain: jest.Mocked<WorkflowPlanDomain>;

  beforeEach(async () => {
    // Creo que esto está al re pedo, si total después mockeo las cosas en cada método
    workflowDao = {
      getWorkflow: jest.fn(),
      getWorkflowMetadata: jest.fn(),
      createWorkflow: jest.fn(),
      disableWorkflow: jest.fn(),
      enableWorkflow: jest.fn(),
      getWorkflowPlan: jest.fn(),
      doesWorkflowExist: jest.fn(),
    } as jest.Mocked<WorkflowDao>;

    workflowPlanDomain = {
      getPlanFromYaml: jest.fn(),
      getPlanProperties: jest.fn(),
    } as jest.Mocked<WorkflowPlanDomain>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WorkflowDomain,
          useClass: WorkflowDomainImpl,
        },
        {
          provide: WorkflowDao,
          useValue: workflowDao,
        },
        {
          provide: WorkflowPlanDomain,
          useValue: workflowPlanDomain,
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    workflowDomain = module.get<WorkflowDomain>(WorkflowDomain);
    workflowDao = module.get<jest.Mocked<WorkflowDao>>(WorkflowDao);
    workflowPlanDomain =
      module.get<jest.Mocked<WorkflowPlanDomain>>(WorkflowPlanDomain);
  });

  describe('createWorkflow', () => {
    it('should create a workflow successfully', async () => {
      const fileContent = 'some yaml content';
      const wfPlan = { steps: [] }; // Mocked workflow plan
      const wfProperties = {
        name: 'TestWorkflow',
        description: 'Test Description',
        inputParams: {},
        version: '1.0.0',
      };

      workflowPlanDomain.getPlanFromYaml.mockResolvedValue(wfPlan);
      workflowPlanDomain.getPlanProperties.mockResolvedValue(wfProperties);
      workflowDao.doesWorkflowExist.mockResolvedValue(false);
      workflowDao.createWorkflow.mockResolvedValue(true);

      const result = await workflowDomain.createWorkflow(fileContent);

      expect(workflowPlanDomain.getPlanFromYaml).toHaveBeenCalledWith(
        fileContent,
      );
      expect(workflowPlanDomain.getPlanProperties).toHaveBeenCalledWith(
        fileContent,
      );
      expect(workflowDao.doesWorkflowExist).toHaveBeenCalledWith(
        'TestWorkflow',
        '1.0.0',
      );
      expect(workflowDao.createWorkflow).toHaveBeenCalledWith({
        version: '1.0.0',
        name: 'TestWorkflow',
        description: 'Test Description',
        inputParams: {},
        plan: wfPlan,
        enabled: true,
      });
      expect(result).toEqual({
        version: '1.0.0',
        name: 'TestWorkflow',
        description: 'Test Description',
        inputParams: {},
        plan: wfPlan,
        enabled: true,
      });
    });

    it('should throw WorkflowAlreadyExistsException if workflow exists', async () => {
      const fileContent = 'some yaml content';
      const wfProperties = {
        name: 'ExistingWorkflow',
        description: 'Test Description',
        inputParams: {},
        version: '1.0.0',
      };

      workflowPlanDomain.getPlanFromYaml.mockResolvedValue({ steps: [] });
      workflowPlanDomain.getPlanProperties.mockResolvedValue(wfProperties);
      workflowDao.doesWorkflowExist.mockResolvedValue(true);

      await expect(workflowDomain.createWorkflow(fileContent)).rejects.toThrow(
        WorkflowAlreadyExistsException,
      );

      expect(workflowDao.doesWorkflowExist).toHaveBeenCalledWith(
        'ExistingWorkflow',
        '1.0.0',
      );
      expect(workflowDao.createWorkflow).not.toHaveBeenCalled();
    });
  });

  describe('isWorkflowEnabled', () => {
    it('should return true if workflow is enabled', async () => {
      workflowDao.getWorkflow.mockResolvedValue({
        enabled: true,
      } as Workflow);

      const result = await workflowDomain.isWorkflowEnabled('TestWorkflow');
      expect(result).toBe(true);
    });

    it('should return false if workflow is not enabled', async () => {
      workflowDao.getWorkflow.mockResolvedValue({
        enabled: false,
      } as Workflow);

      const result = await workflowDomain.isWorkflowEnabled('TestWorkflow');
      expect(result).toBe(false);
    });

    it('should throw WorkflowNotFoundException if workflow does not exist', async () => {
      workflowDao.getWorkflow.mockResolvedValue(null);

      await expect(
        workflowDomain.isWorkflowEnabled('NonExistentWorkflow'),
      ).rejects.toThrow(WorkflowNotFoundException);
    });
  });

  describe('toggleWorkflow', () => {
    it('should disable an enabled workflow', async () => {
      workflowDao.getWorkflow.mockResolvedValue({
        name: 'TestWorkflow',
        enabled: true,
      } as Workflow);
      workflowDao.disableWorkflow.mockResolvedValue(true);

      const result = await workflowDomain.toggleWorkflow('TestWorkflow');

      expect(result).toBe(false);
    });

    it('should enable a disabled workflow', async () => {
      workflowDao.getWorkflow.mockResolvedValue({
        name: 'TestWorkflow',
        enabled: false,
      } as Workflow);
      workflowDao.enableWorkflow.mockResolvedValue(true);

      const result = await workflowDomain.toggleWorkflow('TestWorkflow');

      expect(result).toBe(true);
    });

    it('should throw WorkflowNotFoundException if workflow does not exist', async () => {
      workflowDao.getWorkflow.mockResolvedValue(null);

      await expect(
        workflowDomain.toggleWorkflow('NonExistentWorkflow'),
      ).rejects.toThrow(WorkflowNotFoundException);
    });
  });
});
