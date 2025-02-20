import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowExecutionStepDomainImpl } from '@domains/WorkflowExecutionStepDomainImpl';
import { WorkflowExecutionDao } from '@interfaces/repository/WorkflowExecutionDao';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import {
  WfExecutionStatus,
  WorkflowExecution,
} from '@repositories/entities/worflow-execution.entity';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('WorkflowExecutionStepDomainImpl', () => {
  let service: WorkflowExecutionStepDomainImpl;
  let workflowExecutionRepository: WorkflowExecutionDao;
  let stepScheduleRequestGateway: StepScheduleRequestGateway;

  const workflowExecutionExample: WorkflowExecution = {
    executionId: 'executionId',
    name: 'name',
    description: 'description',
    inputParams: {},
    inputArguments: {},
    plan: { steps: [] },
    outputs: {},
    status: WfExecutionStatus.PERSISTED,
    errorReason: 'errorReason',
    lastStepRun: 'lastStepRun',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowExecutionStepDomainImpl,
        {
          provide: WorkflowExecutionDao,
          useValue: {
            getStepsFromExecution: jest.fn(),
            updateStatus: jest.fn(),
            updateStep: jest.fn(),
            markExecutionAsError: jest.fn(),
            getWorkflowExecutionById: jest.fn(),
          },
        },
        {
          provide: StepScheduleRequestGateway,
          useValue: {
            queueStep: jest.fn(),
          },
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<WorkflowExecutionStepDomainImpl>(
      WorkflowExecutionStepDomainImpl,
    );
    workflowExecutionRepository =
      module.get<WorkflowExecutionDao>(WorkflowExecutionDao);
    stepScheduleRequestGateway = module.get<StepScheduleRequestGateway>(
      StepScheduleRequestGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runNextStep', () => {
    it('should log an error if no steps are found', async () => {
      jest
        .spyOn(workflowExecutionRepository, 'getStepsFromExecution')
        .mockResolvedValue(null);
      jest
        .spyOn(workflowExecutionRepository, 'getWorkflowExecutionById')
        .mockResolvedValue(workflowExecutionExample);

      const loggerSpy = jest.spyOn(service['LOGGER'], 'error');
      await service.runNextStep('executionId');

      expect(loggerSpy).toHaveBeenCalledWith(
        'No steps found for workflow executionId',
      );
    });

    it('should finish execution if next step is undefined', async () => {
      jest
        .spyOn(workflowExecutionRepository, 'getStepsFromExecution')
        .mockResolvedValue({
          steps: [{ name: 'step1', task: 'task1', params: [] }],
          lastRun: 'step1',
          inputArguments: {},
        });
      jest
        .spyOn(workflowExecutionRepository, 'getWorkflowExecutionById')
        .mockResolvedValue(workflowExecutionExample);

      const finishExecutionSpy = jest.spyOn(service, 'finishExecution');
      await service.runNextStep('executionId');

      expect(finishExecutionSpy).toHaveBeenCalledWith('executionId');
    });

    it('should queue the next step if found', async () => {
      jest
        .spyOn(workflowExecutionRepository, 'getStepsFromExecution')
        .mockResolvedValue({
          steps: [
            { name: 'step1', task: 'task1', params: [] },
            { name: 'step2', task: 'task2', params: [] },
          ],
          lastRun: 'step1',
          inputArguments: {},
        });
      jest
        .spyOn(workflowExecutionRepository, 'getWorkflowExecutionById')
        .mockResolvedValue(workflowExecutionExample);

      await service.runNextStep('executionId');

      expect(stepScheduleRequestGateway.queueStep).toHaveBeenCalledWith({
        workflowExecutionId: 'executionId',
        name: 'step2',
        task: 'task2',
        inputArgs: {},
      });
      expect(workflowExecutionRepository.updateStatus).toHaveBeenCalledWith(
        'executionId',
        WfExecutionStatus.STEP_SCHEDULED,
      );
    });
  });

  describe('saveAnswer', () => {
    it('should update step and status', async () => {
      jest
        .spyOn(workflowExecutionRepository, 'getStepsFromExecution')
        .mockResolvedValue({
          steps: [{ name: 'step1', task: 'task1', params: [] }],
          lastRun: null,
          inputArguments: {},
        });

      await service.saveAnswer('executionId', 'answerPath', 'name');

      expect(workflowExecutionRepository.updateStep).toHaveBeenCalledWith(
        'executionId',
        'answerPath',
        'name',
      );
      expect(workflowExecutionRepository.updateStatus).toHaveBeenCalledWith(
        'executionId',
        WfExecutionStatus.STEP_FINISHED,
      );
    });
  });

  describe('finishExecution', () => {
    it('should update status to EXECUTION_FINISHED', async () => {
      await service.finishExecution('executionId');

      expect(workflowExecutionRepository.updateStatus).toHaveBeenCalledWith(
        'executionId',
        WfExecutionStatus.EXECUTION_FINISHED,
      );
    });
  });

  describe('handleError', () => {
    it('should log an error and mark execution as error', async () => {
      const error = 'Some error';
      const loggerSpy = jest.spyOn(service['LOGGER'], 'error');
      const markExecutionAsErrorSpy = jest
        .spyOn(workflowExecutionRepository, 'markExecutionAsError')
        .mockResolvedValue({} as WorkflowExecution);

      await service.handleError('executionId', error);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Error in workflow with ID executionId: ${error}`,
      );
      expect(markExecutionAsErrorSpy).toHaveBeenCalledWith(
        'executionId',
        error,
      );
    });

    it('should log an error if marking execution as error fails', async () => {
      const error = 'Some error';
      const loggerSpy = jest.spyOn(service['LOGGER'], 'error');
      jest
        .spyOn(workflowExecutionRepository, 'markExecutionAsError')
        .mockRejectedValue(new Error('Failed to mark as error'));

      await expect(service.handleError('executionId', error)).rejects.toThrow(
        'Unable to mark workflow as error',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Error in workflow with ID executionId: ${error}`,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Failed to mark workflow with ID executionId as error:`,
        expect.any(Error),
      );
    });
  });
});
