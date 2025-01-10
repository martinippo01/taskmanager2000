export interface WorkflowExecutionStepDomain {
  runNextStep(executionId: string): Promise<void>;
}
