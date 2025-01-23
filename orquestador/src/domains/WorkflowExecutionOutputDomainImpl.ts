import { WorkflowExecutionStepOutputNotFoundException } from '@exceptions/WorkflowExecutionStepOutputNotFoundException';
import { WorkflowExecutionOutputDomain } from '@interfaces/domains/WorkflowExecutionOutputDomain';
import { WorkflowExecutionDao } from '@interfaces/repository/WorkflowExecutionDao';
import { WorkflowExecutionOutputDao } from '@interfaces/repository/WorkflowExecutionOutputDao';
import { WorkflowExecutionStepOutput } from '@interfaces/types/StepOutput';
import { Inject, Logger } from '@nestjs/common';

class WorkflowExecutionOutputDomainImpl
  implements WorkflowExecutionOutputDomain
{
  private readonly logger = new Logger(WorkflowExecutionOutputDomainImpl.name);

  constructor(
    @Inject(WorkflowExecutionOutputDao)
    private readonly workflowExecutionOutputDao: WorkflowExecutionOutputDao,
    @Inject(WorkflowExecutionDao)
    private readonly workflowExecutionDao: WorkflowExecutionDao,
  ) {}

  async getStepOutput(
    workflowExecutionId: string,
    stepName: string,
  ): Promise<WorkflowExecutionStepOutput> {
    this.logger.debug(
      `Getting output for step '${stepName}' from workflow execution with id '${workflowExecutionId}'`,
    );
    const outputPath = await this.workflowExecutionDao.getStepResultPath(
      workflowExecutionId,
      stepName,
    );
    this.logger.debug(
      `Output path for step '${stepName}' from workflow execution with id '${workflowExecutionId}' retrieved successfully`,
    );
    if (!outputPath) {
      throw new WorkflowExecutionStepOutputNotFoundException(
        workflowExecutionId,
        stepName,
      );
    }
    const output = await this.workflowExecutionOutputDao.getOutput(outputPath);
    this.logger.debug(
      `Output for step '${stepName}' from workflow execution with id '${workflowExecutionId}' retrieved successfully`,
    );
    return output;
  }
}

export default WorkflowExecutionOutputDomainImpl;
