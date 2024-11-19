import {
  CreateWorkflowRequest,
  ExecuteWorkflowRequest,
  Workflow
} from '@interfaces/Workflow.js';
import WorkflowService from '@interfaces/WorkflowService.js';

class WorkflowServiceRestImpl implements WorkflowService {
  createWorkflow(request: CreateWorkflowRequest): Promise<Workflow> {
    throw new Error('Method not implemented.');
  }

  enableWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  disableWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  executeWorkflow(request: ExecuteWorkflowRequest): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowServiceRestImpl;
