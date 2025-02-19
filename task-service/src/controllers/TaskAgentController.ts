import TaskAgentNotFoundException from '@exceptions/TaskAgentNotFoundException';
import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import {
  TaskAgentRegisterRequestDto,
  TaskAgentRegisterResponseDto,
} from '@interfaces/types/TaskAgentRegister';
import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { TaskData } from '@shared/TaskData';
import { TaskServiceTaskAgentsPath } from '@shared/TaskServicePaths';
import { TracerGateway } from '@shared/TracerGateway';

@Controller(TaskServiceTaskAgentsPath)
class TaskAgentController {
  private readonly LOGGER = new Logger(TaskAgentController.name);

  constructor(
    @Inject(TaskServiceDomain)
    private readonly taskServiceDomain: TaskServiceDomain,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  @Get(':taskName')
  async getTaskData(@Param('taskName') taskName: string): Promise<TaskData> {
    return this.tracerGateway.trace(
      'TaskAgentController.getTaskData',
      async (span) => {
        span.setAttribute('task.name', taskName);
        this.LOGGER.debug(`Getting task data for task ${taskName}`);
        const taskData = await this.taskServiceDomain.getTaskData(taskName);
        span.setAttribute('task.exists', !!taskData);
        if (!taskData) {
          throw new TaskAgentNotFoundException(taskName);
        }
        this.LOGGER.debug(`Task data: ${JSON.stringify(taskData)}`);
        this.LOGGER.debug(`Task data for task ${taskName} found`);
        return taskData;
      },
    );
  }

  @Post(':taskName')
  async registerTaskAgent(
    @Param('taskName') taskName: string,
    @Body() request: TaskAgentRegisterRequestDto,
  ): Promise<TaskAgentRegisterResponseDto> {
    return this.tracerGateway.trace(
      'TaskAgentController.registerTaskAgent',
      async (span) => {
        span.setAttribute('task.name', taskName);
        this.LOGGER.debug(`Registering task agent for task ${taskName}`);
        const taskData: TaskData = {
          kafka: request.kafkaData,
          optionalParams: request.optionalParams || [],
          params: request.params,
        };
        this.LOGGER.debug(`Task data to register: ${JSON.stringify(taskData)}`);
        const { registered, updated } =
          await this.taskServiceDomain.registerTask(taskName, taskData);
        span.setAttribute('task.registered', registered);
        span.setAttribute('task.updated', updated);
        if (registered) {
          this.LOGGER.log(`New task agent with name ${taskName} registered`);
        } else if (updated) {
          this.LOGGER.log(`Task agent with name ${taskName} updated`);
        }
        return { registered, updated };
      },
    );
  }
}

export default TaskAgentController;
