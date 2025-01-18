import { TaskData } from '@shared/TaskData';
/**
 * Interface representing a gateway to interact with the Task Service.
 */
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

  /**
   * Retrieves information about a task given its name.
   * @param taskName - The name of the task to retrieve information for.
   * @returns A promise that resolves to the task data or null if the task is not found.
   */
  getTaskInfo(taskName: string): Promise<TaskData | null>;
}

export const TaskServiceGateway = Symbol('TaskServiceGateway');
