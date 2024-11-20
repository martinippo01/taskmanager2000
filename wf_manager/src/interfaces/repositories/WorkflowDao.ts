import { Workflow, WorkflowEntity } from '@interfaces/types/Workflow';

export interface WorkflowDao {
  getWorkflow(name: string): Promise<WorkflowEntity | null>;
  getWorkflowById(id: number): Promise<WorkflowEntity | null>;
  createWorkflow(workflow: Workflow): Promise<WorkflowEntity>;
  enableWorkflow(name: string): Promise<boolean>;
  disableWorkflow(name: string): Promise<boolean>;
}

export const WorkflowDao = Symbol('WorkflowDao');
