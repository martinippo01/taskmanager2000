import { WorkflowExecutionQueryDomain } from '@interfaces/domains/WorklowExecutionQueryDomain';
import { Inject } from '@nestjs/common';
import { WorkflowExecution } from '@repositories/entities/worflow-execution.entity';
import { Step } from '@shared/WorkflowPlan';
import { Injectable } from '@nestjs/common';
import {
  stepsInfo,
  WorkflowExecutionDao,
} from '@interfaces/repository/WorkflowExecutionDao';

@Injectable()
export class WorkflowExecutionQueryDomainImpl
  implements WorkflowExecutionQueryDomain
{
  constructor(
    @Inject(WorkflowExecutionDao)
    private readonly workflowExecutionRepository: WorkflowExecutionDao,
  ) {}

  async getWorkflowExecutionByExecutionId(
    executionId: string,
  ): Promise<WorkflowExecution | null> {
    return this.workflowExecutionRepository.getWorkflowExecutionById(
      executionId,
    );
  }

  async getStepDataByExecutionId(
    executionId: string,
    stepNumber: number,
  ): Promise<Step> {
    const stepsInfo: stepsInfo | null =
      await this.workflowExecutionRepository.getStepsFromExecution(executionId);
    if (!!!stepsInfo) throw new Error(`Execution ${executionId} not found`);
    if (!!!stepsInfo.steps[stepNumber])
      throw new Error(
        `Step ${stepNumber} not found in execution ${executionId}`,
      );
    return stepsInfo.steps[stepNumber];
  }

  async listExecutionIdsByWorkflowName(
    workflowName: string,
  ): Promise<string[] | null> {
    return await this.workflowExecutionRepository.getExecutionIdsByName(
      workflowName,
    );
  }

  async listExecutionIds(): Promise<string[]> {
    return await this.workflowExecutionRepository.getAllExecutionIds();
  }
}
