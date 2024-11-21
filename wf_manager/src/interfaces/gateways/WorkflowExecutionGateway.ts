import { Workflow, InputArguments } from '@interfaces/types/Workflow';

export interface WorkflowExecutionGateway {
  queueWorkflow(
    workflow: Workflow,
    inputArgs: InputArguments,
  ): Promise<boolean>;
}

export const WorkflowExecutionGateway = Symbol('WorkflowExecutionGateway');
