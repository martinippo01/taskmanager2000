import { InputArguments } from './WorkflowInput';

export type StepScheduleRequest = {
  workflowExecutionId: string;
  name: string;
  task: string;
  inputArgs: InputArguments;
};
