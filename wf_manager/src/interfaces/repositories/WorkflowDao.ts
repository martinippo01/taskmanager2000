import { Workflow, WorkflowMetadata } from '@interfaces/types/Workflow';
import { Plan } from 'shared/lib/WorkflowPlan';

export interface WorkflowDao {
  getWorkflow(name: string): Promise<Workflow | null>;
  getWorkflowMetadata(name: string): Promise<WorkflowMetadata | null>;
  getWorkflowPlan(name: string): Promise<Plan | null>;
  createWorkflow(workflow: Workflow): Promise<boolean>;
  enableWorkflow(name: string): Promise<boolean>;
  disableWorkflow(name: string): Promise<boolean>;
}

export const WorkflowDao = Symbol('WorkflowDao');
