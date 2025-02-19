import { WorkflowExecution } from '@repositories/entities/worflow-execution.entity';
import { Step } from '@shared/WorkflowPlan';

export interface WorkflowExecutionQueryDomain {
  /**
   * Methods:
   *  - Get workflow execution by execution id
   *      - Give data about a workflow execution, including status and answer (if available)
   *  - Get data of a step by execution id.
   *  - List execution ids by workflow name
   *  -
   */
  getWorkflowExecutionByExecutionId(
    executionId: string,
  ): Promise<WorkflowExecution | null>;
  getStepDataByExecutionId(
    executionId: string,
    stepNumber: number,
  ): Promise<Step>;
  listExecutionIdsByWorkflowName(
    workflowName: string,
  ): Promise<string[] | null>;
  listExecutionIds(): Promise<string[]>;
  getAnswerByWorkflowExecutionId(
    id: string,
  ): Promise<Record<string, string> | null>;
}
export const WorkflowExecutionQueryDomain = Symbol(
  'WorkflowExecutionQueryDomain',
);
