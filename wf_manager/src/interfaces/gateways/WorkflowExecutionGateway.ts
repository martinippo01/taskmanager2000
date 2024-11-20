import {
  WorkflowExecution,
  InputArgumentType,
  Workflow,
} from '@interfaces/types/Workflow';

export interface WorkflowExecutionGateway {
  queueWorkflow(
    workflow: Workflow,
    inputArgs: Record<string, InputArgumentType>,
  ): Promise<boolean>;
}

export const WorkflowExecutionGateway = Symbol('WorkflowExecutionGateway');
