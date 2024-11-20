import {
  InputArgumentType,
  Workflow,
  InputParamType,
} from '@interfaces/types/Workflow';

export interface WorkflowInputDomain {
  areInputParamsValid(
    plan: File,
    inputParams: Record<string, string>,
  ): Record<string, InputParamType>;
  getInputArgs(
    workflow: Workflow,
    inputArgs: Record<string, string>,
  ): Record<string, InputArgumentType>;
}

export const WorkflowInputDomain = Symbol('WorkflowInputDomain');
