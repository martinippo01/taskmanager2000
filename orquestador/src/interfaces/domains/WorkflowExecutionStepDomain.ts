export interface WorkflowExecutionStepDomain {
  runNextStep(executionId: string): Promise<void>;
  handleError(executionId: string, error: string): Promise<void>;
  saveAnswer(
    executionId: string,
    answerPath: string,
    name: string,
  ): Promise<void>;
}
export const WorkflowExecutionStepDomain = Symbol(
  'WorkflowExecutionStepDomain',
);
