import { InputParams } from 'shared/lib/WorkflowInput';

export interface WorkflowPlanDomain {
  isPlanFormatValid(plan: File): boolean;
  getPlanProps(plan: File): {
    name: string;
    description: string;
    inputParams: InputParams;
  };
}

export const WorkflowPlanDomain = Symbol('WorkflowPlanDomain');
