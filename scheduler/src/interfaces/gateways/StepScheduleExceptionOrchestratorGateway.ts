import { StepScheduleException } from '@shared/StepScheduleException';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';

export interface StepScheduleExceptionOrchestratorGateway {
  notify(
    request: StepScheduleRequest,
    exception: StepScheduleException,
  ): Promise<void>;
}

export const StepScheduleExceptionOrchestratorGateway = Symbol(
  'StepScheduleExceptionOrchestratorGateway',
);
