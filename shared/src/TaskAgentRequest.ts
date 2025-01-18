import { InputArguments } from './WorkflowInput';

export type TaskAgentRequest = {
  workflowExecutionId: string;
  name: string;
  inputArgs: InputArguments;
};
