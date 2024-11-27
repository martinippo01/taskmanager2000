import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowDomainImpl } from '../../src/domains/WorkflowDomainImpl';
import { WorkflowDao } from '../../src/daos/WorkflowDao';
import { WorkflowPlanDao } from '../../src/daos/WorkflowPlanDao';
import { WorkflowPlanDomain } from '../../src/interfaces/domains/WorkflowPlanDomain';
import {
  InvalidWorkflowPlanException,
  WorkflowAlreadyExistsException,
  WorkflowNotFoundException,
} from '../src/exceptions';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateWorkflowRequestDto } from '../../src/dtos/CreateWorkflowRequestDto';
import { Workflow } from '../../src/entities/Workflow';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain';

describe('WorkflowDomainImpl', () => {
  let workflowDomain: WorkflowDomainImpl;
  let workflowDao: jest.Mocked<WorkflowDao>;
  let workflowPlanDao: jest.Mocked<WorkflowPlanDao>;
  let workflowPlanDomain: jest.Mocked<WorkflowPlanDomain>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WorkflowDomain,
          useClass: WorkflowDomainImpl,
        },
        {
          provide: WorkflowDao,
          useValue: {
            getWorkflow: jest.fn(),
            createWorkflow: jest.fn(),
            disableWorkflow: jest.fn(),
            enableWorkflow: jest.fn(),
            // Add other methods if WorkflowDao has additional functionality
            updateWorkflow: jest.fn(),
          },
        },
        {
          provide: WorkflowPlanDao,
          useValue: {
            savePlan: jest.fn(),
            // Add other methods if WorkflowPlanDao has additional functionality
            getPlanPath: jest.fn(),
          },
        },
        {
          provide: WorkflowPlanDomain,
          useValue: {
            isPlanFormatValid: jest.fn(),
            getPlanProperties: jest.fn(),
            // Add other methods if WorkflowPlanDomain has additional functionality
            validateSteps: jest.fn(),
          },
        },
        // Add more providers here
        {
          provide: AnotherService,
          useValue: {
            someMethod: jest.fn(),
            anotherMethod: jest.fn(),
          },
        },
        {
          provide: YetAnotherService,
          useValue: {
            yetAnotherMethod: jest.fn(),
          },
        },
      ],
    }).compile();

    workflowDomain = module.get<WorkflowDomainImpl>(WorkflowDomainImpl);
    workflowDao = module.get<WorkflowDao>(WorkflowDao);
    workflowPlanDao = module.get<WorkflowPlanDao>(WorkflowPlanDao);
    workflowPlanDomain = module.get<WorkflowPlanDomain>(WorkflowPlanDomain);
  });

  describe('createWorkflow', () => {
    it('should create a workflow successfully', async () => {
      const mockRequest: CreateWorkflowRequestDto = {
        plan: {} as any,
      };

      const mockPlanProperties = {
        name: 'testWorkflow',
        description: 'Test Description',
        inputParams: {},
      };

      workflowPlanDomain.isPlanFormatValid.mockResolvedValueOnce(true);
      workflowPlanDomain.getPlanProperties.mockResolvedValueOnce(
        mockPlanProperties,
      );
      workflowDao.getWorkflow.mockResolvedValueOnce(null);
      workflowPlanDao.savePlan.mockResolvedValueOnce('/path/to/plan.yaml');
      workflowDao.createWorkflow.mockResolvedValueOnce(undefined);

      const result = await workflowDomain.createWorkflow(mockRequest);

      expect(result).toEqual({
        version: 1,
        name: 'testWorkflow',
        description: 'Test Description',
        inputParams: {},
        plan: '/path/to/plan.yaml',
      });

      expect(workflowPlanDomain.isPlanFormatValid).toHaveBeenCalledWith(
        mockRequest.plan,
      );
      expect(workflowPlanDomain.getPlanProperties).toHaveBeenCalledWith(
        mockRequest.plan,
      );
      expect(workflowDao.getWorkflow).toHaveBeenCalledWith('testWorkflow');
      expect(workflowPlanDao.savePlan).toHaveBeenCalledWith(mockRequest.plan);
      expect(workflowDao.createWorkflow).toHaveBeenCalledWith({
        version: 1,
        name: 'testWorkflow',
        description: 'Test Description',
        inputParams: {},
        plan: '/path/to/plan.yaml',
      });
    });

    it('should throw InvalidWorkflowPlanException if plan is invalid', async () => {
      const mockRequest: CreateWorkflowRequestDto = {
        plan: {} as any,
      };

      workflowPlanDomain.isPlanFormatValid.mockResolvedValueOnce(false);

      await expect(workflowDomain.createWorkflow(mockRequest)).rejects.toThrow(
        InvalidWorkflowPlanException,
      );

      expect(workflowPlanDomain.isPlanFormatValid).toHaveBeenCalledWith(
        mockRequest.plan,
      );
      expect(workflowPlanDomain.getPlanProperties).not.toHaveBeenCalled();
      expect(workflowDao.getWorkflow).not.toHaveBeenCalled();
      expect(workflowPlanDao.savePlan).not.toHaveBeenCalled();
    });

    it('should throw WorkflowAlreadyExistsException if workflow exists', async () => {
      const mockRequest: CreateWorkflowRequestDto = {
        plan: {} as any,
      };

      workflowPlanDomain.isPlanFormatValid.mockResolvedValueOnce(true);
      workflowPlanDomain.getPlanProperties.mockResolvedValueOnce({
        name: 'testWorkflow',
        description: 'Test Description',
        inputParams: {},
      });
      workflowDao.getWorkflow.mockResolvedValueOnce({
        name: 'testWorkflow',
        version: 1,
        description: 'Existing Workflow',
        inputParams: {},
        plan: '/path/to/plan.yaml',
      });

      await expect(workflowDomain.createWorkflow(mockRequest)).rejects.toThrow(
        WorkflowAlreadyExistsException,
      );

      expect(workflowPlanDomain.isPlanFormatValid).toHaveBeenCalledWith(
        mockRequest.plan,
      );
      expect(workflowPlanDomain.getPlanProperties).toHaveBeenCalledWith(
        mockRequest.plan,
      );
      expect(workflowDao.getWorkflow).toHaveBeenCalledWith('testWorkflow');
      expect(workflowPlanDao.savePlan).not.toHaveBeenCalled();
    });
  });

  describe('isWorkflowEnabled', () => {
    it('should return true if the workflow is enabled', async () => {
      workflowDao.getWorkflow.mockResolvedValueOnce({
        enabled: true,
      } as any);

      const result = await workflowDomain.isWorkflowEnabled('testWorkflow');

      expect(result).toBe(true);
      expect(workflowDao.getWorkflow).toHaveBeenCalledWith('testWorkflow');
    });

    it('should throw WorkflowNotFoundException if workflow does not exist', async () => {
      workflowDao.getWorkflow.mockResolvedValueOnce(null);

      await expect(
        workflowDomain.isWorkflowEnabled('testWorkflow'),
      ).rejects.toThrow(WorkflowNotFoundException);

      expect(workflowDao.getWorkflow).toHaveBeenCalledWith('testWorkflow');
    });
  });

  // Add more tests for other methods like toggleWorkflow and getWorkflow
});
