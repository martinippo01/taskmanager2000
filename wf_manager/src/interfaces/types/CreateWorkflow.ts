import { InputParams } from './WorkflowInput';

export type CreateWorkflowRequestDto = {
  plan: File; // The plan file of the workflow
};

export type WorkflowCreation = {
  name: string; // The name of the workflow
  description: string; // The description of the workflow
  inputParams: InputParams; // The input parameters of the workflow. The key is the name of the parameter and the value is the type of the parameter
  plan: File; // The plan file of the workflow
};

export type CreateWorkflowResponseDto = {
  created: boolean; // Whether the workflow was created
};
