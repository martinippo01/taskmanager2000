import { InputParams } from '@interfaces/types/Workflow';

export interface WorkflowPlanDomain {
  isPlanFormatValid(plan: File): Promise<boolean>;
  getPlanProperties(plan: File): Promise<{
    name: string;
    description: string;
    inputParams: InputParams;
  }>;
}

export const WorkflowPlanDomain = Symbol('WorkflowPlanDomain');
