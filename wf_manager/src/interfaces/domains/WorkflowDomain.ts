import { Workflow } from '@interfaces/types/Workflow';
import { CreateWorkflowRequestDto } from '@interfaces/types/CreateWorkflow';

export interface WorkflowDomain {
  isWorkflowEnabled(name: string, version?: string): Promise<boolean>;
  createWorkflow(request: CreateWorkflowRequestDto): Promise<Workflow | null>;
  toggleWorkflow(name: string, version?: string): Promise<boolean>;
  getWorkflow(name: string, version?: string): Promise<Workflow | null>;
}

export const WorkflowDomain = Symbol('WorkflowDomain');
