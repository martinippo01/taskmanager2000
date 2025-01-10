import { StepScheduleException } from '@shared/StepScheduleException';
import { InputArguments } from '@shared/WorkflowInput';

export type StepScheduleResult =
  | { success: true; kafkaData: string }
  | { success: false; error: StepScheduleException };

export interface TaskServiceGateway {
  checkParameters(
    task: string,
    inputArgs: InputArguments,
  ): Promise<StepScheduleResult>;
}

export const TaskServiceGateway = Symbol('TaskServiceGateway');
