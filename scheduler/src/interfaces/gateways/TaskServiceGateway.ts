export interface TaskServiceGateway {
  /**
   * Confirms if the task exists in the Task Service.
   * @param taskId - The ID of the task to confirm.
   * @returns A promise that resolves to a boolean indicating if the task exists.
   */
  confirmTaskExists(taskId: string): Promise<boolean>;

  /**
   * Retrieves the queue where the request should be sent.
   * @param taskId - The ID of the task to get the queue for.
   * @returns A promise that resolves to the name of the queue.
   */
  getTaskQueue(taskId: string): Promise<string>;

  /**
   * Reaches to the ping endpoint at Task Service for health check.
   * @returns A promise that resolves to a boolean indicating if the Task Service is healthy.
   */
  pingTaskService(): Promise<boolean>;
}
import { TaskData } from '@shared/TaskData';

export interface TaskServiceGateway {
  getTaskInfo(taskName: string): Promise<TaskData | null>;
}

export const TaskServiceGateway = Symbol('TaskServiceGateway');
