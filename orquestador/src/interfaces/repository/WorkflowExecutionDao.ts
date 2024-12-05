import {
  WfExecutionStatus,
  WorkflowExecution,
} from '@repositories/entities/worflow-execution.entity';
import { Step } from '@shared/WorkflowPlan';

export type stepsInfo = { steps: Step[]; lastRun: string | null };

export interface WorkflowExecutionDao {
  saveWorkflowExecution(
    data: Partial<WorkflowExecution>,
  ): Promise<WorkflowExecution>;

  updateStatus(
    executionId: string,
    newStatus: WfExecutionStatus,
  ): Promise<WorkflowExecution | null>;

  deleteWorkflow(executionId: string): Promise<boolean>;

  getStepsFromExecution(executionId: string): Promise<stepsInfo | null>;

  updateStep(executionId: string, lastStepRun: string, wantedOutput: string);
}

export const WorkflowExecutionDao = Symbol('WorkflowExecutionDao');
