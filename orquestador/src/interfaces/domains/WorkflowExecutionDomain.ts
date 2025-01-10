import { WorkflowExecutionRequest } from '@shared/WorkflowExecutionRequest';

export interface WorkflowExecutionDomain {
  runNewWorkflowExecution(request: WorkflowExecutionRequest): Promise<{
    alreadyRun: boolean; // The workflow execution has already been run (this is a duplicate request)
    couldRun: boolean; // The workflow execution could be run. Must be set when alreadyRunned is false
  }>;
}

export const WorkflowExecutionDomain = Symbol('WorkflowExecutionDomain');
