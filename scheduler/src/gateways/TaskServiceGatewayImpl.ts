import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';

export class TaskServiceGatewayImpl implements TaskServiceGateway {
  async confirmTaskExists(taskId: string): Promise<boolean> {
    // TODO: Implement this method when the Task Service is ready
    return false;
  }

  async getTaskQueue(taskId: string): Promise<string> {
    // TODO: Implement this method when the Task Service is ready
    return '';
  }

  async pingTaskService(): Promise<boolean> {
    // TODO: Check if necessary to implement this method
    return false;
  }
}
