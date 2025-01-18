import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { Inject, Logger } from '@nestjs/common';
import { isTaskData, TaskData } from '@shared/TaskData';
import TaskAgentDaoClientException from '@exceptions/TaskAgentDaoClientException';
import { TaskAgentDaoClient } from '@interfaces/repositories/TaskAgentDaoClient';

class TaskAgentDaoImpl implements TaskAgentDao {
  private readonly LOGGER = new Logger(TaskAgentDaoImpl.name);

  constructor(
    @Inject(TaskAgentDaoClient)
    private readonly taskAgentDaoClient: TaskAgentDaoClient,
  ) {}

  private getTaskKey(taskName: string): string {
    return `TASK:${taskName}`;
  }

  async getTaskData(taskName: string): Promise<TaskData | null> {
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
    if (!response) {
      this.LOGGER.debug(`No task data found for task ${taskName}`);
      return null;
    } else if (!isTaskData(response)) {
      throw new TaskAgentDaoClientException('Invalid task data format');
    }
    return response;
  }

  private async doesTaskExist(taskName: string): Promise<boolean> {
    const taskData = await this.getTaskData(taskName);
    return !!taskData;
  }

  async registerTask(
    taskName: string,
    taskData: TaskData,
  ): Promise<{ registered: boolean; updated: boolean }> {
    this.LOGGER.debug(`Registering task agent for task ${taskName}`);
    const key = this.getTaskKey(taskName);
    try {
      const exists = await this.doesTaskExist(taskName);
      await this.taskAgentDaoClient.setTaskData(key, taskData);
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
  }
}

export default TaskAgentDaoImpl;
