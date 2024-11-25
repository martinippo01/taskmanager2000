import { Workflow } from '@interfaces/types/Workflow';
import { InputArguments } from 'shared/lib/WorkflowInput';

export interface WorkflowInputDomain {
  getInputArgs(
    workflow: Workflow,
    inputArgs: Record<string, string | string[]>,
  ): InputArguments;
}

export const WorkflowInputDomain = Symbol('WorkflowInputDomain');
