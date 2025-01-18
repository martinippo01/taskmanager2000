import { TaskData } from '@shared/TaskData';

export interface TaskServiceDomain {
  getTaskData(taskName: string): Promise<TaskData | null>;
  registerTask(
    taskName: string,
    taskData: TaskData,
  ): Promise<{ registered: boolean; updated: boolean }>;
}

export const TaskServiceDomain = Symbol('TaskServiceDomain');
