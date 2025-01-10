import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { TaskData } from '@shared/TaskData';

export interface TaskAgentsGateway {
  sendStep(
    taskData: TaskData,
    request: StepScheduleRequest,
  ): Promise<{ sent: boolean }>;
}

export const TaskAgentsGateway = Symbol('TaskAgentsGateway');
