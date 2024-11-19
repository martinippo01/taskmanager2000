import { Workflow, WorkflowEntity } from './Workflow.js';

interface WorkflowDao {
  getWorkflow(name: string): Promise<WorkflowEntity | null>;
  getWorkflowById(id: number): Promise<WorkflowEntity | null>;
  createWorkflow(workflow: Workflow): Promise<WorkflowEntity>;
  enableWorkflow(name: string): Promise<boolean>;
  disableWorkflow(name: string): Promise<boolean>;
}

export default WorkflowDao;
