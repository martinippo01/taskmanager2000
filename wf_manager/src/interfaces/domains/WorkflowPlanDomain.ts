import { InputParams } from 'shared/lib/WorkflowInput';
import { Plan } from 'shared/lib/WorkflowPlan';

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
