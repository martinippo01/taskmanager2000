import { InputParams } from 'shared/lib/WorkflowInput';
import { Plan } from 'shared/lib/WorkflowPlan';

export interface WorkflowPlanDomain {
  getPlanFromYaml(plan: File): Promise<Plan>;
  getPlanProperties(plan: File): Promise<{
    name: string;
    description: string;
    inputParams: InputParams;
    version: string;
  }>;
}

export const WorkflowPlanDomain = Symbol('WorkflowPlanDomain');
