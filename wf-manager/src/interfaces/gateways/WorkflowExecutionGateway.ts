import { Workflow } from '@interfaces/types/Workflow';
import { InputArguments } from '@shared/WorkflowInput';

export interface WorkflowExecutionGateway {
  queueWorkflow(
    workflow: Workflow,
    inputArguments: InputArguments,
  ): Promise<string>;
}

export const WorkflowExecutionGateway = Symbol('WorkflowExecutionGateway');
