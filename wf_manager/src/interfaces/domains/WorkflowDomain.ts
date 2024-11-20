import { Workflow } from '@interfaces/types/Workflow';
import { get } from 'http';
import { WorkflowCreation } from '@interfaces/types/CreateWorkflow';

export interface WorkflowDomain {
  doesWorkflowExist(name: string): Promise<boolean>;
  isWorkflowEnabled(name: string): Promise<boolean>;
  createWorkflow(request: WorkflowCreation): Promise<Workflow | null>;
  toggleWorkflow(name: string): Promise<boolean>;
  getWorkflow(name: string): Promise<Workflow | null>;
}

export const WorkflowDomain = Symbol('WorkflowDomain');
