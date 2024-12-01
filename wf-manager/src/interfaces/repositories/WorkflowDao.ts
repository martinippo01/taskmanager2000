import { Workflow, WorkflowMetadata } from '@interfaces/types/Workflow';
import { Plan } from '@shared/WorkflowPlan';

export interface WorkflowDao {
  doesWorkflowExist(name: string, version?: string): Promise<boolean>;
  getWorkflow(name: string, version?: string): Promise<Workflow | null>;
  getWorkflowMetadata(
    name: string,
    version?: string,
  ): Promise<WorkflowMetadata | null>;
  getWorkflowPlan(name: string, version?: string): Promise<Plan | null>;
  createWorkflow(workflow: Workflow): Promise<boolean>;
  enableWorkflow(name: string, version?: string): Promise<boolean>;
  disableWorkflow(name: string, version?: string): Promise<boolean>;
}

export const WorkflowDao = Symbol('WorkflowDao');
