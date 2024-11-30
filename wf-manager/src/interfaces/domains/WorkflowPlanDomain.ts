import { InputParams } from '@shared/WorkflowInput';
import { Plan } from '@shared/WorkflowPlan';

export interface WorkflowPlanDomain {
  getPlanFromYaml(fileContent: string): Promise<Plan>;
  getPlanProperties(fileContent: string): Promise<{
    name: string;
    description: string;
    inputParams: InputParams;
    version: string;
  }>;
}

export const WorkflowPlanDomain = Symbol('WorkflowPlanDomain');
