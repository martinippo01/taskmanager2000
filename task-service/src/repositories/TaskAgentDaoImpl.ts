import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { Inject, Logger } from '@nestjs/common';
import { TaskAgentDaoClient } from './TaskAgentDaoProvider';
import { isTaskData, TaskData } from '@shared/TaskData';
import TaskAgentDaoParseException from '@exceptions/TaskAgentDaoParseException';
import TaskAgentDaoClientException from '@exceptions/TaskAgentDaoClientException';

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
    let response: string | null;
    try {
      response = await this.taskAgentDaoClient.get(this.getTaskKey(taskName));
    } catch (e) {
      throw new TaskAgentDaoClientException(
        `Error getting task data for task ${taskName}`,
        e,
      );
    }
    if (!response) {
      this.LOGGER.debug(`No task data found for task ${taskName}`);
      return null;
    }
    this.LOGGER.debug(`Got response for task ${taskName}`);
    const parsed = JSON.parse(response);
    if (!isTaskData(parsed)) {
      throw new TaskAgentDaoParseException('Invalid task data format');
    }
    return parsed;
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
      await this.taskAgentDaoClient.set(key, JSON.stringify(taskData));
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
