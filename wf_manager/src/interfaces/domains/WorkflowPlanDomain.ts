export interface WorkflowPlanDomain {
  isPlanFormatValid(plan: File): boolean;
}

export const WorkflowPlanDomain = Symbol('WorkflowPlanDomain');
