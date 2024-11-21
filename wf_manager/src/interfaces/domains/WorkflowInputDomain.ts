import {
  Workflow,
  InputArguments,
  InputParams,
} from '@interfaces/types/Workflow';

export interface WorkflowInputDomain {
  areInputParamsValid(
    plan: File,
    inputParams: Record<string, string>,
  ): InputParams;
  getInputArgs(
    workflow: Workflow,
    inputArgs: Record<string, string>,
  ): InputArguments;
}

export const WorkflowInputDomain = Symbol('WorkflowInputDomain');
