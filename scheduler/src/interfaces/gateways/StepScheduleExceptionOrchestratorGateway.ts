import { StepScheduleException } from '@shared/StepScheduleException';

export interface StepScheduleExceptionOrchestratorGateway {
  notify(stepScheduleException: StepScheduleException): Promise<void>;
}

export const StepScheduleExceptionOrchestratorGateway = Symbol(
  'StepScheduleExceptionOrchestratorGateway',
);
