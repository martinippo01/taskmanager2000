export type Param = {
  name: string;
  type: string;
} & (
  | {
      from: string;
    }
  | {
      value: string;
      constant?: boolean;
    }
); // The parameters of the step. The key is the name of the parameter and the value is the type of the parameter

export type Step = {
  name: string; // The name of the step
  task: string; // The task of the step
  params: Param[]; // The parameters of the step. The key is the name of the parameter and the value is the type of the parameter
};

export type Plan = {
  steps: Step[]; // The steps of the plan
};
