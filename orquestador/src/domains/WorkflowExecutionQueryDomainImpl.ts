import { WorkflowExecutionQueryDomain } from '@interfaces/domains/WorklowExecutionQueryDomain';
import { Inject } from '@nestjs/common';
import { WorkflowExecution } from '@repositories/entities/worflow-execution.entity';
import { Step } from '@shared/WorkflowPlan';
import { Injectable } from '@nestjs/common';
import {
  stepsInfo,
  WorkflowExecutionDao,
} from '@interfaces/repository/WorkflowExecutionDao';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class WorkflowExecutionQueryDomainImpl
  implements WorkflowExecutionQueryDomain
{
  constructor(
    @Inject(WorkflowExecutionDao)
    private readonly workflowExecutionRepository: WorkflowExecutionDao,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async getWorkflowExecutionByExecutionId(
    executionId: string,
  ): Promise<WorkflowExecution | null> {
    return this.tracerGateway.trace(
      'WorkflowExecutionQueryDomainImpl.getWorkflowExecutionByExecutionId',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);

        return this.workflowExecutionRepository.getWorkflowExecutionById(
          executionId,
        );
      },
    );
  }

  async getStepDataByExecutionId(
    executionId: string,
    stepNumber: number,
  ): Promise<Step> {
    return this.tracerGateway.trace(
      'WorkflowExecutionQueryDomainImpl.getStepDataByExecutionId',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        span.setAttribute('workflow.execution.step.number', stepNumber);

        const stepsInfo: stepsInfo | null =
          await this.workflowExecutionRepository.getStepsFromExecution(
            executionId,
          );
        if (!!!stepsInfo) {
          span.addEvent('Workflow execution not found');
          throw new Error(`Execution ${executionId} not found`);
        }
        if (!!!stepsInfo.steps[stepNumber]) {
          span.addEvent('Workflow execution step not found');
          throw new Error(
            `Step ${stepNumber} not found in execution ${executionId}`,
          );
        }
        return stepsInfo.steps[stepNumber];
      },
    );
  }

  async listExecutionIdsByWorkflowName(
    workflowName: string,
  ): Promise<string[] | null> {
    return this.tracerGateway.trace(
      'WorkflowExecutionQueryDomainImpl.listExecutionIdsByWorkflowName',
      async (span) => {
        span.setAttribute('workflow.name', workflowName);

        return this.workflowExecutionRepository.getExecutionIdsByName(
          workflowName,
        );
      },
    );
  }

  async listExecutionIds(): Promise<string[]> {
    return this.tracerGateway.trace(
      'WorkflowExecutionQueryDomainImpl.listExecutionIds',
      async (span) => {
        span.addEvent('Listing all workflow executions');

        return this.workflowExecutionRepository.getAllExecutionIds();
      },
    );
  }
}
