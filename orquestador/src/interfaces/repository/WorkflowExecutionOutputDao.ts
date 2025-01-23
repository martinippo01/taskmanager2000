import { WorkflowExecutionStepOutput } from '@interfaces/types/StepOutput';

export interface WorkflowExecutionOutputDao {
  getOutput(path: string): Promise<WorkflowExecutionStepOutput>;
}

export const WorkflowExecutionOutputDao = Symbol('WorkflowExecutionOutputDao');
