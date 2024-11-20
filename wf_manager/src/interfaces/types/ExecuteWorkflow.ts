export type ExecuteWorkflowRequestDto = {
  name: string; // The name of the workflow
  inputArgs: Record<string, string>; // The input arguments of the workflow. The key is the name of the argument and the value is the value of the argument
};

export type ExecuteWorkflowResponseDto = {
  queued: boolean; // Indicates the workflow was queued to execute
};
