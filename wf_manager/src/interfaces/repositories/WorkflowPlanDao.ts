export interface WorkflowPlanDao {
  savePlan(plan: File): Promise<string>;
  getPlan(id: string): Promise<File | null>;
}

export const WorkflowPlanDao = Symbol('WorkflowPlanDao');
