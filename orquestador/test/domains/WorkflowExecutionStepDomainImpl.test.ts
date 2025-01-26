import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowExecutionStepDomainImpl } from '@domains/WorkflowExecutionStepDomainImpl';
import { WorkflowExecutionDao } from '@interfaces/repository/WorkflowExecutionDao';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { WfExecutionStatus } from '@repositories/entities/worflow-execution.entity';

describe('WorkflowExecutionStepDomainImpl', () => {
  let service: WorkflowExecutionStepDomainImpl;
  let workflowExecutionRepository: WorkflowExecutionDao;
  let stepScheduleRequestGateway: StepScheduleRequestGateway;

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
          },
        },
        {
          provide: StepScheduleRequestGateway,
          useValue: {
            queueStep: jest.fn(),
          },
        },
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
          lastRun: 'step1',
          inputArguments: {},
        });

      await service.saveAnswer('executionId', 'answerPath');

      expect(workflowExecutionRepository.updateStep).toHaveBeenCalledWith(
        'executionId',
        'step1',
        'answerPath',
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
});
