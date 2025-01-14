import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { Inject, Logger } from '@nestjs/common';
import { TaskData } from '@shared/TaskData';

class TaskServiceDomainImpl implements TaskServiceDomain {
  private readonly LOGGER = new Logger(TaskServiceDomainImpl.name);

  constructor(
    @Inject(TaskAgentDao)
    private readonly taskAgentDao: TaskAgentDao,
  ) {}

  getTaskData(taskName: string): Promise<TaskData | null> {
    this.LOGGER.debug(`Getting task data for task ${taskName}`);
    return this.taskAgentDao.getTaskData(taskName);
  }

  registerTask(
    taskName: string,
    taskData: TaskData,
  ): Promise<{ registered: boolean; updated: boolean }> {
    this.LOGGER.debug(`Registering task agent for task ${taskName}`);
    return this.taskAgentDao.registerTask(taskName, taskData);
  }
}

export default TaskServiceDomainImpl;
