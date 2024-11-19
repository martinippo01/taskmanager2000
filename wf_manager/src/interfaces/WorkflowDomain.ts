import { CreateWorkflowRequest, Workflow } from './Workflow.js';

interface WorkflowDomain {
  doesWorkflowExist(name: string): Promise<boolean>;
  isWorkflowEnabled(name: string): Promise<boolean>;
  createWorkflow(request: CreateWorkflowRequest): Promise<Workflow>;
  enableWorkflow(name: string): Promise<boolean>;
  disableWorkflow(name: string): Promise<boolean>;
}

export default WorkflowDomain;
