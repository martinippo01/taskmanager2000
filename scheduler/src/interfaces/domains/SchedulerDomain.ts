import { StepScheduleRequest } from '@shared/StepScheduleRequest';

export interface SchedulerDomain {
  scheduleStepExecution(
    stepScheduleRequest: StepScheduleRequest,
  ): Promise<boolean>;
}

export const SchedulerDomain = Symbol('SchedulerDomain');
