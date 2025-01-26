export interface WorkflowExecutionStepDomain {
  runNextStep(executionId: string): Promise<void>;
  handleError(executionId: string, error: string): Promise<void>;
}
export const WorkflowExecutionStepDomain = Symbol(
  'WorkflowExecutionStepDomain',
);
