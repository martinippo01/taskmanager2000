import { StepScheduleExceptionOrchestratorGateway } from '@interfaces/gateways/StepScheduleExceptionOrchestratorGateway';
import { TaskAgentsGateway } from '@interfaces/gateways/TaskAgentsGateway';
import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { StepScheduleException } from '@shared/StepScheduleException';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import {
  areKafkaTaskDataEqual,
  KafkaTaskData,
  TaskData,
} from '@shared/TaskData';
import { InputArguments } from '@shared/WorkflowInput';
import { Kafka, logLevel, Producer } from 'kafkajs';

class TaskAgentGatewayImpl {
  private readonly producer: Producer;
  private readonly kafka: Kafka;
  private _isConnected: boolean = false;

  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly topic: string,
    private readonly brokers: string,
    private readonly clientId: string,
  ) {
    this.kafka = new Kafka({
      clientId,
      brokers: brokers.split(','),
      ssl: false,
      sasl: {
        mechanism: 'plain',
        username,
        password,
      },
      logLevel: logLevel.ERROR,
    });
    this.producer = this.kafka.producer();
    const { CONNECT, DISCONNECT } = this.producer.events;
    this.producer.on(CONNECT, () => this.setConnected(true));
    this.producer.on(DISCONNECT, () => this.setConnected(false));
  }

  private setConnected(connected: boolean): void {
    this._isConnected = connected;
  }

  getKafkaConfig(): KafkaTaskData {
    return {
      brokers: this.brokers,
      username: this.username,
      password: this.password,
      topic: this.topic,
    };
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async send(key: string, inputArgs: InputArguments): Promise<void> {
    const value = { inputArgs };
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key,
          value: JSON.stringify(value),
        },
      ],
    });
  }
}

export class TaskAgentsGatewayImpl
  implements TaskAgentsGateway, OnModuleDestroy
{
  private readonly LOGGER = new Logger(TaskAgentsGatewayImpl.name);
  private readonly CLIENT_ID = 'scheduler';
  private readonly TASK_AGENT_GATEWAYS: Map<string, TaskAgentGatewayImpl> =
    new Map();

  constructor(
    @Inject(StepScheduleExceptionOrchestratorGateway)
    private readonly stepScheduleExceptionOrchestratorGateway: StepScheduleExceptionOrchestratorGateway,
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
  ): TaskAgentGatewayImpl {
    let taskAgentGateway: TaskAgentGatewayImpl | undefined;
    if (this.hasTaskChanged(taskName, taskData)) {
      taskAgentGateway = new TaskAgentGatewayImpl(
        taskData.kafka.username,
        taskData.kafka.password,
        taskData.kafka.topic,
        taskData.kafka.brokers,
        this.CLIENT_ID,
      );
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
  ): Promise<boolean> {
    const taskAgentGateway = this.getTaskAgentGateway(request.task, taskData);
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
      await taskAgentGateway.send(request.name, request.inputArgs);
      this.LOGGER.log(
        `Step with name ${request.name} from workflow execution with id ${request.workflowExecutionId} sent successfully to task agent gateway for task ${request.task}`,
      );
      return true;
    } catch (error) {
      this.LOGGER.error(
        `Failed to send step with name ${request.name} from workflow execution with id ${request.workflowExecutionId} to task agent gateway for task ${request.task}, with error: ${error}`,
      );
      await this.stepScheduleExceptionOrchestratorGateway.notify(
        request,
        StepScheduleException.TASK_ERROR,
      );
      return false;
    }
  }

  onModuleDestroy() {
    this.LOGGER.log('Disconnecting task agent gateways');
    this.TASK_AGENT_GATEWAYS.forEach(async (taskAgentGateway) => {
      if (taskAgentGateway.isConnected()) {
        await taskAgentGateway.disconnect();
      }
    });
  }
}
