import { InputArgumentType } from './Workflow.js';

interface WorkflowInputDomain {
  areInputParamsValid(inputParams: Record<string, string>): boolean;
  getInputArgs(
    inputArgs: Record<string, string>
  ): Record<string, InputArgumentType>;
}

export default WorkflowInputDomain;
