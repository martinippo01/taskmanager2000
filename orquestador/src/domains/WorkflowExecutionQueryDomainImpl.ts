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
    let execution = {}; // TODO: Call repository to get the execution by id.

    return execution as WorkflowExecution;
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
    const executionsByName = []; // TODO: Call repository to get all executions that match a name.
    //  await this.workflowExecutionRepository.getExecutionIdsByName(workflowName);
    return executionsByName;
  }

  async listExecutionIds(): Promise<string[]> {
    const executionIds: string[] = [];
    //  await this.workflowExecutionRepository.getAllExecutionIds();
    return executionIds;
  }
}
