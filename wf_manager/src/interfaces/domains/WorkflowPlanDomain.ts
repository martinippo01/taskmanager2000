import { InputParams } from '@interfaces/types/Workflow';

export interface WorkflowPlanDomain {
  isPlanFormatValid(plan: File): Promise<boolean>;
  getPlanProperties(plan: File): {
    name: string;
    description: string;
    inputParams: InputParams;
  };
}

export const WorkflowPlanDomain = Symbol('WorkflowPlanDomain');
