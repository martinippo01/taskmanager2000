import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';
import { AxiosResponse } from 'axios';
import { TaskData } from '@shared/TaskData';
import {
  TaskAgentsPath,
  TaskServicePingPath,
} from '@shared/TaskServiceTaskAgentPath';

@Injectable()
export class TaskServiceGatewayImpl implements TaskServiceGateway {
  private readonly LOGGER = new Logger(TaskServiceGatewayImpl.name);

  constructor(private readonly httpService: HttpService) {}

  private readonly TASK_SERVICE_URL: string =
    process.env.TASK_SERVICE_URL || 'http://task-service/';

  async getTaskInfo(taskName: string): Promise<TaskData | null> {
    try {
      const response: AxiosResponse<TaskData> | undefined =
        await this.httpService
          .get<TaskData>(
            `${this.TASK_SERVICE_URL}/${TaskAgentsPath}/${taskName}`,
          )
          .toPromise();
      if (!response) throw new Error('Failed to retrieve task info');

      return response.data;
    } catch (error) {
      this.LOGGER.error('Failed to retrieve task info for name: ' + taskName);
      return null;
    }
  }

  async confirmTaskExists(taskId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<any> | undefined = await this.httpService
        .get<any>(`${this.TASK_SERVICE_URL}/${TaskAgentsPath}/${taskId}`)
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
        .get<string>(`${this.TASK_SERVICE_URL}/${TaskAgentsPath}/${taskId}`)
        .toPromise();
      if (!response) throw new Error('Failed to retrieve task queue');
      const taskData = JSON.parse(response.data).taskData as TaskData;
      return taskData.kafka.topic;
    } catch (error) {
      this.LOGGER.error('Failed to retrieve task queue with ID: ' + taskId);
      throw new Error('Failed to retrieve task queue');
    }
  }

  async pingTaskService(): Promise<boolean> {
    try {
      const response: AxiosResponse<boolean> | undefined =
        await this.httpService
          .get<boolean>(`${this.TASK_SERVICE_URL}/${TaskServicePingPath}`)
          .toPromise();
      return !response ? false : true;
    } catch (error) {
      this.LOGGER.error('Failed to ping Task Service');
      return false;
    }
  }
}
