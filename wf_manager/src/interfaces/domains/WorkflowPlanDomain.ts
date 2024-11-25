import { InputParams } from 'shared/lib/WorkflowInput';

export interface WorkflowPlanDomain {
  isPlanFormatValid(plan: File): Promise<boolean>;
  getPlanProperties(plan: File): {
    name: string;
    description: string;
    inputParams: InputParams;
  };
}

export const WorkflowPlanDomain = Symbol('WorkflowPlanDomain');
