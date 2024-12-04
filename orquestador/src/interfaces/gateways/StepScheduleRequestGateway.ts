import { StepScheduleRequest } from '@shared/StepScheduleRequest';

export interface StepScheduleRequestGateway {
  queueStep(stepScheduleRequest: StepScheduleRequest): Promise<boolean>;
}

export const StepScheduleRequestGateway = Symbol('StepScheduleRequestGateway');
