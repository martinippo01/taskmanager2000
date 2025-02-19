import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';
import { AxiosResponse } from 'axios';
import { TaskData } from '@shared/TaskData';
import {
  TaskServiceTaskAgentsPath,
  TaskServicePingPath,
} from '@shared/TaskServicePaths';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class TaskServiceGatewayImpl implements TaskServiceGateway {
  private readonly LOGGER = new Logger(TaskServiceGatewayImpl.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  private readonly TASK_SERVICE_URL: string =
    process.env.TASK_SERVICE_URL || 'http://task-service:3000';

  async getTaskInfo(taskName: string): Promise<TaskData | null> {
    return this.tracerGateway.trace(
      'TaskServiceGatewayImpl.getTaskInfo',
      async (span) => {
        span.setAttribute('task.name', taskName);
        this.LOGGER.debug('Retrieving task info for name: ' + taskName);

        try {
          const response: AxiosResponse<TaskData> | undefined =
            await this.httpService
              .get<TaskData>(
                `${this.TASK_SERVICE_URL}/${TaskServiceTaskAgentsPath}/${taskName}`,
              )
              .toPromise();
          span.setAttribute('task.exists', !!response);
          if (!response) throw new Error('Failed to retrieve task info');

          this.LOGGER.debug(
            `Respuesta de task service: ${JSON.stringify(response.data)}`,
          );

          return response.data;
        } catch (error) {
          this.LOGGER.error(
            'Failed to retrieve task info for name: ' +
              taskName +
              ' - with error: ' +
              error,
          );
          return null;
        }
      },
    );
  }

  async confirmTaskExists(taskId: string): Promise<boolean> {
    return this.tracerGateway.trace(
      'TaskServiceGatewayImpl.confirmTaskExists',
      async (span) => {
        span.setAttribute('task.name', taskId);
        try {
          const response: AxiosResponse<any> | undefined =
            await this.httpService
              .get<any>(
                `${this.TASK_SERVICE_URL}/${TaskServiceTaskAgentsPath}/${taskId}`,
              )
              .toPromise();
          span.setAttribute('task.exists', !!response);
          return !response
            ? false
            : response.status >= 200 && response.status < 300;
        } catch (error) {
          if (error.response && error.response.status === 404) {
            return false;
          }
          this.LOGGER.error(
            'Failed to confirm task existence for ID: ' + taskId,
          );
          return false;
        }
      },
    );
  }

  async getTaskQueue(taskId: string): Promise<string> {
    return this.tracerGateway.trace(
      'TaskServiceGatewayImpl.getTaskQueue',
      async (span) => {
        span.setAttribute('task.name', taskId);
        try {
          const response: AxiosResponse<string> | undefined =
            await this.httpService
              .get<string>(
                `${this.TASK_SERVICE_URL}/${TaskServiceTaskAgentsPath}/${taskId}`,
              )
              .toPromise();
          span.setAttribute('task.exists', !!response);
          if (!response) throw new Error('Failed to retrieve task queue');
          const taskData = JSON.parse(response.data).taskData as TaskData;
          return taskData.kafka.topic;
        } catch (error) {
          this.LOGGER.error(
            'Failed to retrieve task queue with ID: ' +
              taskId +
              ' - with error: ' +
              error,
          );
          throw new Error('Failed to retrieve task queue');
        }
      },
    );
  }

  async pingTaskService(): Promise<boolean> {
    return this.tracerGateway.trace(
      'TaskServiceGatewayImpl.pingTaskService',
      async (span) => {
        try {
          const response: AxiosResponse<boolean> | undefined =
            await this.httpService
              .get<boolean>(`${this.TASK_SERVICE_URL}/${TaskServicePingPath}`)
              .toPromise();
          span.setAttribute('task.service.healthy', !!response);
          return !response ? false : true;
        } catch (error) {
          span.addEvent('Failed to ping Task Service');
          this.LOGGER.error(
            'Failed to ping Task Service - with error: ' + error,
          );
          return false;
        }
      },
    );
  }
}
