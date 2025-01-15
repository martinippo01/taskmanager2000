import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';
import { AxiosResponse } from 'axios';

@Injectable()
export class TaskServiceGatewayImpl implements TaskServiceGateway {
  private readonly LOGGER = new Logger(TaskServiceGatewayImpl.name);

  constructor(private readonly httpService: HttpService) {}

  async confirmTaskExists(taskId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<any> | undefined = await this.httpService
        .get<any>(`http://task-service/tasks/${taskId}`)
        .toPromise();
      return !response
        ? false
        : response.status >= 200 && response.status < 300;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      this.LOGGER.error('Failed to confirm task existence for ID: ' + taskId);
      return false;
    }
  }

  async getTaskQueue(taskId: string): Promise<string> {
    try {
      const response: AxiosResponse<string> | undefined = await this.httpService
        .get<string>(`http://task-service/tasks/${taskId}/queue`)
        .toPromise();
      if (!response) throw new Error('Failed to retrieve task queue');

      return response.data;
    } catch (error) {
      this.LOGGER.error('Failed to retrieve task queue with ID: ' + taskId);
      throw new Error('Failed to retrieve task queue');
    }
  }

  async pingTaskService(): Promise<boolean> {
    try {
      const response: AxiosResponse<boolean> | undefined =
        await this.httpService
          .get<boolean>('http://task-service/ping')
          .toPromise();
      return !response ? false : true;
    } catch (error) {
      this.LOGGER.error('Failed to ping Task Service');
      return false;
    }
  }
}
