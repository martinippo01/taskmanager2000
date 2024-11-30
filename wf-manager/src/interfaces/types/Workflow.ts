import { InputParams } from '@shared/WorkflowInput';
import { Plan } from '@shared/WorkflowPlan';

export type Workflow = {
  version: string; // The version of the workflow
  name: string; // The name of the workflow
  description: string; // The description of the workflow
  inputParams: InputParams; // The input parameters of the workflow. The key is the name of the parameter and the value is the type of the parameter
  plan: Plan; // The path to the plan file of the workflow
  enabled: boolean; // The status of the workflow
};

export type WorkflowMetadata = Omit<Workflow, 'plan'>;
