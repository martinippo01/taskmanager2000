import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { Inject, Logger } from '@nestjs/common';
import { TaskData } from '@shared/TaskData';
import { TracerGateway } from '@shared/TracerGateway';

class TaskServiceDomainImpl implements TaskServiceDomain {
  private readonly LOGGER = new Logger(TaskServiceDomainImpl.name);

  constructor(
    @Inject(TaskAgentDao)
    private readonly taskAgentDao: TaskAgentDao,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async getTaskData(taskName: string): Promise<TaskData | null> {
    return this.tracerGateway.trace(
      'TaskServiceDomainImpl.getTaskData',
      async (span) => {
        span.setAttribute('task.name', taskName);
        this.LOGGER.debug(`Getting task data for task from dao ${taskName}`);
        return this.taskAgentDao.getTaskData(taskName);
      },
    );
  }

  async registerTask(
    taskName: string,
    taskData: TaskData,
  ): Promise<{ registered: boolean; updated: boolean }> {
    return this.tracerGateway.trace(
      'TaskServiceDomainImpl.registerTask',
      async (span) => {
        span.setAttribute('task.name', taskName);
        this.LOGGER.debug(`Registering task agent for task ${taskName}`);
        return this.taskAgentDao.registerTask(taskName, taskData);
      },
    );
  }
}

export default TaskServiceDomainImpl;
