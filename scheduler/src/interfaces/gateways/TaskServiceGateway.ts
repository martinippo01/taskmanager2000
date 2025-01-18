import { TaskData } from '@shared/TaskData';

export interface TaskServiceGateway {
  getTaskInfo(taskName: string): Promise<TaskData | null>;
}

export const TaskServiceGateway = Symbol('TaskServiceGateway');
