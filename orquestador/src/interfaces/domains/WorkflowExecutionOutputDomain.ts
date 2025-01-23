import { WorkflowExecutionStepOutput } from '@interfaces/types/StepOutput';

export interface WorkflowExecutionOutputDomain {
  getStepOutput(
    workflowExecutionId: string,
    stepName: string,
  ): Promise<WorkflowExecutionStepOutput>;
}

export const WorkflowExecutionOutputDomain = Symbol(
  'WorkflowExecutionOutputDomain',
);
