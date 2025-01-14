import { StepScheduleException } from '@shared/StepScheduleException';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';

export interface SchedulerDomain {
  scheduleStepExecution(stepScheduleRequest: StepScheduleRequest): Promise<{
    error: StepScheduleException | null;
  }>;
}

export const SchedulerDomain = Symbol('SchedulerDomain');
