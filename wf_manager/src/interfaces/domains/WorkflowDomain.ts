import { Workflow } from '@interfaces/types/Workflow';

export interface WorkflowDomain {
  isWorkflowEnabled(name: string, version?: string): Promise<boolean>;
  createWorkflow(fileContent: string): Promise<Workflow | null>;
  toggleWorkflow(name: string, version?: string): Promise<boolean>;
  getWorkflow(name: string, version?: string): Promise<Workflow | null>;
}

export const WorkflowDomain = Symbol('WorkflowDomain');
