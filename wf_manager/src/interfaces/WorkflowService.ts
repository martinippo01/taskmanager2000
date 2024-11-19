import {
  CreateWorkflowRequest,
  DisableWorkflowRequest,
  EnableWorkflowRequest,
  ExecuteWorkflowRequest,
  Workflow
} from './Workflow.js';

interface WorkflowService {
  createWorkflow(request: CreateWorkflowRequest): Promise<Workflow>;
  enableWorkflow(request: EnableWorkflowRequest): Promise<boolean>;
  disableWorkflow(request: DisableWorkflowRequest): Promise<boolean>;
  executeWorkflow(request: ExecuteWorkflowRequest): Promise<boolean>;
}

export default WorkflowService;
