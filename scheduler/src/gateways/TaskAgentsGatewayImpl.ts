import { StepScheduleExceptionOrchestratorGateway } from '@interfaces/gateways/StepScheduleExceptionOrchestratorGateway';
import {
  TaskAgentGateway,
  TaskAgentGatewayProvider,
} from '@interfaces/gateways/TaskAgentGatewayProvider';
import { TaskAgentsGateway } from '@interfaces/gateways/TaskAgentsGateway';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { StepScheduleException } from '@shared/StepScheduleException';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { areKafkaTaskDataEqual, TaskData } from '@shared/TaskData';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class TaskAgentsGatewayImpl
  implements TaskAgentsGateway, OnModuleDestroy
{
  private readonly LOGGER = new Logger(TaskAgentsGatewayImpl.name);
  private readonly CLIENT_ID = 'scheduler';
  private readonly TASK_AGENT_GATEWAYS: Map<string, TaskAgentGateway> =
    new Map();

  constructor(
    @Inject(StepScheduleExceptionOrchestratorGateway)
    private readonly stepScheduleExceptionOrchestratorGateway: StepScheduleExceptionOrchestratorGateway,
    @Inject(TaskAgentGatewayProvider)
    private readonly taskAgentGatewayProvider: TaskAgentGatewayProvider,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  private hasTaskChanged(taskName: string, taskData: TaskData): boolean {
    const taskAgent = this.TASK_AGENT_GATEWAYS.get(taskName);
    if (!taskAgent) {
      this.LOGGER.debug(`New task agent gateway for task ${taskName}`);
      return true;
    }
    const kafkaConfig = taskAgent.getKafkaConfig();
    const hasChanged = !areKafkaTaskDataEqual(taskData.kafka, kafkaConfig);
    if (hasChanged) {
      this.LOGGER.debug(`Task agent gateway for task ${taskName} has changed`);
    }
    return hasChanged;
  }

  private getTaskAgentGateway(
    taskName: string,
    taskData: TaskData,
  ): TaskAgentGateway {
    let taskAgentGateway: TaskAgentGateway | undefined;
    if (this.hasTaskChanged(taskName, taskData)) {
      taskAgentGateway = this.taskAgentGatewayProvider.provide({
        ...taskData.kafka,
        clientId: this.CLIENT_ID,
      });
      this.TASK_AGENT_GATEWAYS.set(taskName, taskAgentGateway);
    } else {
      this.LOGGER.debug(`Reusing task agent gateway for task ${taskName}`);
      taskAgentGateway = this.TASK_AGENT_GATEWAYS.get(taskName)!;
    }
    return taskAgentGateway;
  }

  async sendStep(
    taskData: TaskData,
    request: StepScheduleRequest,
  ): Promise<{ sent: boolean }> {
    return this.tracerGateway.trace(
      'TaskAgentsGatewayImpl.sendStep',
      async (span) => {
        span.setAttribute('step.name', request.name);
        span.setAttribute('workflow.execution.id', request.workflowExecutionId);

        const taskAgentGateway = this.getTaskAgentGateway(
          request.task,
          taskData,
        );
        try {
          if (!taskAgentGateway.isConnected()) {
            this.LOGGER.debug(
              `Connecting to task agent gateway for task ${request.task}`,
            );
            await taskAgentGateway.connect();
            this.LOGGER.log(
              `Connection to task agent gateway for task ${request.task} established`,
            );
          }
          this.LOGGER.debug(
            `Sending step with name ${request.name} from workflow execution with id ${request.workflowExecutionId} to task agent gateway for task ${request.task}`,
          );
          const key = `${request.workflowExecutionId}-${request.name}`;
          await taskAgentGateway.send(key, {
            name: request.name,
            workflowExecutionId: request.workflowExecutionId,
            inputArgs: request.inputArgs,
          });
          this.LOGGER.log(
            `Step with name ${request.name} from workflow execution with id ${request.workflowExecutionId} sent successfully to task agent gateway for task ${request.task}`,
          );
          span.setAttribute('step.sent', true);
          return { sent: true };
        } catch (error) {
          this.LOGGER.error(
            `Failed to send step with name ${request.name} from workflow execution with id ${request.workflowExecutionId} to task agent gateway for task ${request.task}, with error: ${error}`,
          );
          await this.stepScheduleExceptionOrchestratorGateway.notify(
            request,
            StepScheduleException.TASK_ERROR,
          );
          span.setAttribute('step.sent', false);
          return { sent: false };
        }
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.LOGGER.log('Disconnecting task agent gateways');
    const entries = Array.from(this.TASK_AGENT_GATEWAYS.entries());
    entries.forEach(async ([taskName, taskAgentGateway]) => {
      if (taskAgentGateway.isConnected()) {
        try {
          await taskAgentGateway.disconnect();
        } catch (error) {
          this.LOGGER.error(
            `Failed to disconnect task agent gateway for task ${taskName}, with error: ${error}`,
          );
        }
      }
    });
  }
}
