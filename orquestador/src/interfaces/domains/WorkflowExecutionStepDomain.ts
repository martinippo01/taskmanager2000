export interface WorkflowExecutionStepDomain {
  runNextStep(executionId: string): Promise<void>;
}
export const WorkflowExecutionStepDomain = Symbol(
  'WorkflowExecutionStepDomain',
);
