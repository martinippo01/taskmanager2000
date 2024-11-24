import { InputParams } from '@interfaces/types/WorkflowInput';

export interface WorkflowPlanDomain {
  isPlanFormatValid(plan: File): boolean;
  getPlanProps(plan: File): {
    name: string;
    description: string;
    inputParams: InputParams;
  };
}

export const WorkflowPlanDomain = Symbol('WorkflowPlanDomain');
