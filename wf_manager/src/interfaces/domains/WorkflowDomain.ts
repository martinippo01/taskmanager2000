import { Workflow } from '@interfaces/types/Workflow';
import { CreateWorkflowRequestDto } from '@interfaces/types/CreateWorkflow';

export interface WorkflowDomain {
  doesWorkflowExist(name: string): Promise<boolean>;
  isWorkflowEnabled(name: string): Promise<boolean>;
  createWorkflow(request: CreateWorkflowRequestDto): Promise<Workflow | null>;
  toggleWorkflow(name: string): Promise<boolean>;
  getWorkflow(name: string): Promise<Workflow | null>;
}

export const WorkflowDomain = Symbol('WorkflowDomain');
