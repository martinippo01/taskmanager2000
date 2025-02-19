import { Workflow } from '@interfaces/types/Workflow';
import { InputArguments } from '@shared/WorkflowInput';

export interface WorkflowInputDomain {
  getInputArgs(
    workflow: Workflow,
    inputArgs: Record<string, string | string[]>,
  ): Promise<InputArguments>;
}

export const WorkflowInputDomain = Symbol('WorkflowInputDomain');
