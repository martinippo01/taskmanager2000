import { InputParams, InputArguments } from 'shared/lib/WorkflowInput';

export type Workflow = {
  version: number; // The version of the workflow
  name: string; // The name of the workflow
  description: string; // The description of the workflow
  inputParams: InputParams; // The input parameters of the workflow. The key is the name of the parameter and the value is the type of the parameter
  plan: string; // The path to the plan file of the workflow
};

export type WorkflowEntity = {
  version: number; // The version of the workflow
  name: string; // The name of the workflow
  description: string; // The description of the workflow
  inputParams: InputParams; // The input parameters of the workflow
  plan: string; // The path to the plan file of the workflow
  enabled: boolean; // The status of the workflow
};

export type WorkflowExecution = {
  name: string; // The name of the workflow
  description: string; // The description of the workflow
  inputParams: InputParams; // The input parameters of the workflow. The key is the name of the parameter and the value is the type of the parameter
  plan: File; // The path to the plan file of the workflow
  inputArgs: InputArguments; // The input arguments of the workflow. The key is the name of the argument and the value is the value of the argument
};
