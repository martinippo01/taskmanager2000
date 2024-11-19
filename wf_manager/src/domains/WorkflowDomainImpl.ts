import { CreateWorkflowRequest, Workflow } from '@interfaces/Workflow.js';
import WorkflowDomain from '@interfaces/WorkflowDomain.js';

class WorkflowDomainImpl implements WorkflowDomain {
  createWorkflow(request: CreateWorkflowRequest): Promise<Workflow> {
    throw new Error('Method not implemented.');
  }

  disableWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  doesWorkflowExist(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  enableWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  isWorkflowEnabled(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowDomainImpl;
