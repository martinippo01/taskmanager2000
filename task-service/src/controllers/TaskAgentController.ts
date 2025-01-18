import TaskAgentNotFoundException from '@exceptions/TaskAgentNotFoundException';
import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import {
  TaskAgentRegisterRequestDto,
  TaskAgentRegisterResponseDto,
} from '@interfaces/types/TaskAgentRegister';
import { TaskDataGetterResponseDto } from '@interfaces/types/TaskDataGetter';
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

@Controller('task-agents')
class TaskAgentController {
  private readonly LOGGER = new Logger(TaskAgentController.name);

  constructor(
    @Inject(TaskServiceDomain)
    private readonly taskServiceDomain: TaskServiceDomain,
  ) {}

  @Get(':taskName')
  async getTaskData(
    @Param('taskName') taskName: string,
  ): Promise<TaskDataGetterResponseDto> {
    this.LOGGER.debug(`Getting task data for task ${taskName}`);
    const taskData = await this.taskServiceDomain.getTaskData(taskName);
    if (!taskData) {
      throw new TaskAgentNotFoundException(taskName);
    }
    this.LOGGER.debug(`Task data for task ${taskName} found`);
    return { taskData };
  }

  @Post(':taskName')
  async registerTaskAgent(
    @Param('taskName') taskName: string,
    @Body() request: TaskAgentRegisterRequestDto,
  ): Promise<TaskAgentRegisterResponseDto> {
    this.LOGGER.debug(`Registering task agent for task ${taskName}`);
    const taskData: TaskData = {
      kafka: request.kafkaData,
      optionalParams: request.optionalParams || [],
      params: request.params,
    };
    const { registered, updated } = await this.taskServiceDomain.registerTask(
      taskName,
      taskData,
    );
    if (registered) {
      this.LOGGER.log(`New task agent with name ${taskName} registered`);
    } else if (updated) {
      this.LOGGER.log(`Task agent with name ${taskName} updated`);
    }
    return { registered, updated };
  }
}

export default TaskAgentController;
