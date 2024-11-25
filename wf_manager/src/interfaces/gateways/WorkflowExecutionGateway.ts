import { Workflow } from '@interfaces/types/Workflow';
import { InputArguments } from 'shared/lib/WorkflowInput';

export interface WorkflowExecutionGateway {
  queueWorkflow(
    workflow: Workflow,
    inputArgs: InputArguments,
  ): Promise<boolean>;
}

export const WorkflowExecutionGateway = Symbol('WorkflowExecutionGateway');
