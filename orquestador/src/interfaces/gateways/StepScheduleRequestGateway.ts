import { StepScheduleRequest } from '@shared/StepScheduleRequest';

export interface StepScheduleRequestGateway {
  queueStep(stepScheduleRequest: StepScheduleRequest): Promise<
    | {
        queued: true;
      }
    | {
        queued: false;
        error: unknown;
      }
  >;
}

export const StepScheduleRequestGateway = Symbol('StepScheduleRequestGateway');
