import { WorkflowExecutionRequest } from '@shared/WorkflowExecutionRequest';

export interface WorkflowExecutionDomain {
  runNewWorkflowExecution(request: WorkflowExecutionRequest): Promise<{
    alreadyRunned: boolean; // The workflow execution has already been runned (this is a duplicate request)
    couldRun: boolean; // The workflow execution could be runned. Must be set when alreadyRunned is false
  }>;
}

export const WorkflowExecutionDomain = Symbol('WorkflowExecutionDomain');
