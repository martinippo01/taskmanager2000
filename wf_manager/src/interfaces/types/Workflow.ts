type AtomicInputParamType = 'string' | 'number' | 'boolean';
type ArrayInputParamType = `${AtomicInputParamType}[]`;
export type InputParamType = AtomicInputParamType | ArrayInputParamType;

type AtomicInputArgumentType = string | number | boolean;
type ArrayInputArgumentType = AtomicInputArgumentType[];
export type InputArgumentType =
  | AtomicInputArgumentType
  | ArrayInputArgumentType;

export type Workflow = {
  version: string; // The version of the workflow
  name: string; // The name of the workflow
  description: string; // The description of the workflow
  inputParams: Record<string, InputParamType>; // The input parameters of the workflow. The key is the name of the parameter and the value is the type of the parameter
  plan: string; // The path to the plan file of the workflow
};

export type WorkflowEntity = {
  id: number; // The id of the workflow
  version: string; // The version of the workflow
  name: string; // The name of the workflow
  description: string; // The description of the workflow
  inputParams: string[]; // The input parameters of the workflow
  plan: string; // The path to the plan file of the workflow
  enabled: boolean; // The status of the workflow
};

export type WorkflowExecution = {
  name: string; // The name of the workflow
  description: string; // The description of the workflow
  inputParams: Record<string, InputParamType>; // The input parameters of the workflow. The key is the name of the parameter and the value is the type of the parameter
  plan: string; // The path to the plan file of the workflow
  inputArgs: Record<string, InputArgumentType>; // The input arguments of the workflow. The key is the name of the argument and the value is the value of the argument
};
