import { TaskData } from '@shared/TaskData';

export interface TaskAgentDaoClient {
  getTaskData(taskName: string): Promise<unknown | null>;
  setTaskData(taskName: string, taskData: TaskData): Promise<void>;
  ping(): Promise<`PONG`>;
}

export const TaskAgentDaoClient = Symbol('TaskAgentDaoClient');
