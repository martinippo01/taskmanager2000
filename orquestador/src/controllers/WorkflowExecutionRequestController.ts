import { CannotRunNewWorkflowExecution } from '@exceptions/CannotRunNewWorkflowExecution';
import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';
import { KafkaClient } from '@configs/KafkaConfig';
import { Controller, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientKafka,
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { WorkflowExecutionRequest } from '@shared/WorkflowExecutionRequest';

type KafkaEnvironmentVariables = {
  KAFKA_TOPIC: string;
};

@Controller()
export class WorkflowExecutionRequestController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionRequestController.name);

  constructor(
    @Inject(KafkaClient) private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionDomain)
    private readonly workflowExecutionDomain: WorkflowExecutionDomain,
    private readonly configService: ConfigService<KafkaEnvironmentVariables>,
  ) {}

  async onModuleInit() {
    const kafkaTopic =
      this.configService.get('KAFKA_TOPIC', { infer: true }) || '';
    this.kafkaClient.subscribeToResponseOf(kafkaTopic);
    await this.kafkaClient.connect();
  }

  @EventPattern(process.env.KAFKA_TOPIC)
  async handleExecutionRequest(
    @Payload() request: WorkflowExecutionRequest,
    @Ctx() context: KafkaContext,
  ) {
    this.LOGGER.debug(
      `Received workflow execution request with id: ${request.executionId}`,
    );
    const { alreadyRun, couldRun } =
      await this.workflowExecutionDomain.runNewWorkflowExecution(request);
    if (!alreadyRun && !couldRun) {
      throw new CannotRunNewWorkflowExecution(request.executionId);
    }
    if (alreadyRun) {
      this.LOGGER.warn(
        `Workflow execution request with id: ${request.executionId} has already been run`,
      );
    } else {
      this.LOGGER.log(
        `Workflow execution request with id: ${request.executionId} was successfully processed`,
      );
    }

    this.LOGGER.debug(
      `Committing offset for request with id: ${request.executionId}`,
    );
    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    const consumer = context.getConsumer();
    await consumer.commitOffsets([{ topic, partition, offset }]);
    this.LOGGER.debug(
      `Offset committed for request with id: ${request.executionId}`,
    );
  }
}
