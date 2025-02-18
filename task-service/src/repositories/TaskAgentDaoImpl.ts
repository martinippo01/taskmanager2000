import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { Inject, Logger } from '@nestjs/common';
import { isTaskData, TaskData } from '@shared/TaskData';
import TaskAgentDaoClientException from '@exceptions/TaskAgentDaoClientException';
import { TaskAgentDaoClient } from '@interfaces/repositories/TaskAgentDaoClient';
import { TracerGateway } from '@shared/TracerGateway';

class TaskAgentDaoImpl implements TaskAgentDao {
  private readonly LOGGER = new Logger(TaskAgentDaoImpl.name);

  constructor(
    @Inject(TaskAgentDaoClient)
    private readonly taskAgentDaoClient: TaskAgentDaoClient,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  private getTaskKey(taskName: string): string {
    return `TASK:${taskName}`;
  }

  async getTaskData(taskName: string): Promise<TaskData | null> {
    return this.tracerGateway.trace(
      'TaskAgentDaoImpl.getTaskData',
      async (span) => {
        span.setAttribute('task.name', taskName);

        this.LOGGER.debug(`Getting task data for task ${taskName}`);
        let response: unknown | null;
        try {
          response = await this.taskAgentDaoClient.getTaskData(
            this.getTaskKey(taskName),
          );
        } catch (e) {
          throw new TaskAgentDaoClientException(
            `Error getting task data for task ${taskName}`,
            e,
          );
        }
        span.setAttribute('task.exists', !!response);
        if (!response) {
          this.LOGGER.debug(`No task data found for task ${taskName}`);
          return null;
        } else if (!isTaskData(response)) {
          span.addEvent('Invalid task data format');
          throw new TaskAgentDaoClientException('Invalid task data format');
        }
        return response;
      },
    );
  }

  private async doesTaskExist(taskName: string): Promise<boolean> {
    const taskData = await this.getTaskData(taskName);
    return !!taskData;
  }

  async registerTask(
    taskName: string,
    taskData: TaskData,
  ): Promise<{ registered: boolean; updated: boolean }> {
    return this.tracerGateway.trace(
      'TaskAgentDaoImpl.registerTask',
      async (span) => {
        span.setAttribute('task.name', taskName);
        this.LOGGER.debug(`Registering task agent for task ${taskName}`);
        const key = this.getTaskKey(taskName);
        try {
          const exists = await this.doesTaskExist(taskName);
          span.setAttribute('task.exists', exists);
          await this.taskAgentDaoClient.setTaskData(key, taskData);
          span.addEvent(
            `Task agent for task ${taskName} ${exists ? 'updated' : 'registered'}`,
          );
          this.LOGGER.debug(
            `Task agent for task ${taskName} ${exists ? 'updated' : 'registered'}`,
          );
          return { registered: !exists, updated: exists };
        } catch (e) {
          throw new TaskAgentDaoClientException(
            `Error registering task agent for task ${taskName}`,
            e,
          );
        }
      },
    );
  }
}

export default TaskAgentDaoImpl;
