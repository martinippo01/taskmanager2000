import { Test, TestingModule } from '@nestjs/testing';
import WorkflowControllerRestImpl from '@controllers/WorkflowControllerRestImpl'; // Update the path as necessary
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('WorkflowControllerRestImpl', () => {
  let controller: WorkflowControllerRestImpl;
  let mockWorkflowDomain: Partial<WorkflowDomain>;
  let mockWorkflowInputDomain: Partial<WorkflowInputDomain>;
  let mockWorkflowExecutionGateway: Partial<WorkflowExecutionGateway>;
  let mockHealthCheckService: Partial<HealthCheckDomain>;

  beforeEach(async () => {
    mockWorkflowDomain = {
      createWorkflow: jest.fn(),
      toggleWorkflow: jest.fn(),
      getWorkflow: jest.fn(),
    };
    mockWorkflowInputDomain = {
      getInputArgs: jest.fn(),
    };
    mockWorkflowExecutionGateway = {
      queueWorkflow: jest.fn(),
    };
    mockHealthCheckService = {
      check: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowControllerRestImpl],
      providers: [
        { provide: WorkflowDomain, useValue: mockWorkflowDomain },
        { provide: WorkflowInputDomain, useValue: mockWorkflowInputDomain },
        {
          provide: WorkflowExecutionGateway,
          useValue: mockWorkflowExecutionGateway,
        },
        { provide: HealthCheckDomain, useValue: mockHealthCheckService },
        tracerGatewayMockProvider,
      ],
    }).compile();

    controller = module.get<WorkflowControllerRestImpl>(
      WorkflowControllerRestImpl,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createWorkflow', () => {
    it('should create a workflow and return success', async () => {
      const mockFile = {
        buffer: Buffer.from('content'),
      } as Express.Multer.File;

      jest.spyOn(mockWorkflowDomain, 'createWorkflow').mockResolvedValue({
        version: '1',
        name: 'asddas',
        description: 'zxc',
        inputParams: {},
        enabled: true,
        plan: { steps: [] },
      });

      const result = await controller.createWorkflow(mockFile);

      expect(mockWorkflowDomain.createWorkflow).toHaveBeenCalledWith('content');
      expect(result).toEqual({ created: true });
    });

    it('should handle errors gracefully', async () => {
      const mockFile = {
        buffer: Buffer.from('content'),
      } as Express.Multer.File;

      jest.spyOn(mockWorkflowDomain, 'createWorkflow').mockResolvedValue(null);

      const result = await controller.createWorkflow(mockFile);

      expect(result).toEqual({ created: false });
    });
  });

  describe('toggleWorkflow', () => {
    it('should toggle a workflow and return the status', async () => {
      jest.spyOn(mockWorkflowDomain, 'toggleWorkflow').mockResolvedValue(true);

      const result = await controller.toggleWorkflow(
        { name: 'workflow-name' },
        '1.0',
      );

      expect(mockWorkflowDomain.toggleWorkflow).toHaveBeenCalledWith(
        'workflow-name',
        '1.0',
      );
      expect(result).toEqual({
        name: 'workflow-name',
        enabled: true,
        version: '1.0',
      });
    });
  });

  describe('executeWorkflow', () => {
    it('should execute a workflow and return the execution ID', async () => {
      jest.spyOn(mockWorkflowDomain, 'getWorkflow').mockResolvedValue({
        version: '1.0',
        name: 'workflow-name',
        description: 'asdasd',
        inputParams: {},
        plan: { steps: [{ name: 'asd', task: 'echo', params: [] }] },
        enabled: true,
      });
      jest.spyOn(mockWorkflowInputDomain, 'getInputArgs').mockReturnValue({});
      jest
        .spyOn(mockWorkflowExecutionGateway, 'queueWorkflow')
        .mockResolvedValue('execution-id');

      const result = await controller.executeWorkflow(
        { name: 'workflow-name' },
        {},
        '1.0',
      );

      expect(mockWorkflowDomain.getWorkflow).toHaveBeenCalledWith(
        'workflow-name',
        '1.0',
      );
      expect(mockWorkflowExecutionGateway.queueWorkflow).toHaveBeenCalled();
      expect(result).toEqual({ queued: true, executionId: 'execution-id' });
    });

    it('should throw WorkflowNotFoundException if workflow does not exist', async () => {
      jest.spyOn(mockWorkflowDomain, 'getWorkflow').mockResolvedValue(null);

      await expect(
        controller.executeWorkflow({ name: 'workflow-name' }, {}, '1.0'),
      ).rejects.toThrow(WorkflowNotFoundException);
    });
  });

  // describe('healthCheck', () => {
  //   it('should return health status if service is alive', async () => {
  //     jest
  //       .spyOn(mockHealthCheckService, 'check')
  //       .mockResolvedValue({ status: 'ok', details: {} });

  //     const result = await controller.healthCheck();

  //     expect(result).toEqual({ status: 'ok', details: {} });
  //   });

  //   it('should throw NotAliveException if service is not alive', async () => {
  //     jest
  //       .spyOn(mockHealthCheckService, 'checkHealth')
  //       .mockResolvedValue({ status: 'error', details: {} });

  //     await expect(controller.healthCheck()).rejects.toThrow(NotAliveException);
  //   });
  // });
});
