import WorkflowExecutionOutputDomainImpl from '@domains/WorkflowExecutionOutputDomainImpl';
import { WorkflowExecutionStepOutputNotFoundException } from '@exceptions/WorkflowExecutionStepOutputNotFoundException';
import { WorkflowExecutionDao } from '@interfaces/repository/WorkflowExecutionDao';
import { WorkflowExecutionOutputDao } from '@interfaces/repository/WorkflowExecutionOutputDao';
import { WorkflowExecutionStepOutput } from '@interfaces/types/StepOutput';
import { Test } from '@nestjs/testing';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';

describe('WorkflowExecutionOutputDomainImpl', () => {
  const WorkflowExecutionStepOutputExample: WorkflowExecutionStepOutput =
    'output';

  let workflowExecutionOutputDomainImpl: WorkflowExecutionOutputDomainImpl;
  let workflowExecutionOutputDaoMock: jest.Mocked<WorkflowExecutionOutputDao>;
  let workflowExecutionDaoMock: jest.Mocked<WorkflowExecutionDao>;

  beforeEach(async () => {
    workflowExecutionOutputDaoMock = {
      getOutput: jest.fn(),
    };

    workflowExecutionDaoMock = {
      getStepResultPath: jest.fn(),
    } as unknown as jest.Mocked<WorkflowExecutionDao>;

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: WorkflowExecutionOutputDao,
          useValue: workflowExecutionOutputDaoMock,
        },
        {
          provide: WorkflowExecutionDao,
          useValue: workflowExecutionDaoMock,
        },
        WorkflowExecutionOutputDomainImpl,
        tracerGatewayMockProvider,
      ],
    }).compile();

    workflowExecutionOutputDomainImpl =
      module.get<WorkflowExecutionOutputDomainImpl>(
        WorkflowExecutionOutputDomainImpl,
      );
  });

  describe('getStepOutput', () => {
    it('should return the output of a step', async () => {
      const workflowExecutionId = 'workflowExecutionId';
      const stepName = 'stepName';
      const outputPath = 'outputPath';

      workflowExecutionDaoMock.getStepResultPath.mockResolvedValue(outputPath);
      workflowExecutionOutputDaoMock.getOutput.mockResolvedValue(
        WorkflowExecutionStepOutputExample,
      );

      const output = await workflowExecutionOutputDomainImpl.getStepOutput(
        workflowExecutionId,
        stepName,
      );

      expect(output).toBe(WorkflowExecutionStepOutputExample);
      expect(workflowExecutionDaoMock.getStepResultPath).toHaveBeenCalledWith(
        workflowExecutionId,
        stepName,
      );
      expect(workflowExecutionOutputDaoMock.getOutput).toHaveBeenCalledWith(
        outputPath,
      );
    });

    it('should throw an error if the output path is not found', async () => {
      const workflowExecutionId = 'workflowExecutionId';
      const stepName = 'stepName';

      workflowExecutionDaoMock.getStepResultPath.mockResolvedValue(undefined);

      await expect(
        workflowExecutionOutputDomainImpl.getStepOutput(
          workflowExecutionId,
          stepName,
        ),
      ).rejects.toThrow(WorkflowExecutionStepOutputNotFoundException);
      expect(workflowExecutionDaoMock.getStepResultPath).toHaveBeenCalledWith(
        workflowExecutionId,
        stepName,
      );
    });
  });
});
