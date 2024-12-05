import { CannotRunNewWorkflowExecutionException } from '@exceptions/CannotRunNewWorkflowExecution';
import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';
import {
  KafkaWorkflowExecutionRequestClient,
  KafkaWorkflowExecutionRequestEnvironmentVariables,
} from '@configs/KafkaWorkflowExecutionRequestConfig';
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
import KafkaConnectionException from '@exceptions/KakfaConnectionException';

@Controller()
export class WorkflowExecutionRequestController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionRequestController.name);

  constructor(
    @Inject(KafkaWorkflowExecutionRequestClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionDomain)
    private readonly workflowExecutionDomain: WorkflowExecutionDomain,
    private readonly configService: ConfigService<KafkaWorkflowExecutionRequestEnvironmentVariables>,
  ) {}

  async onModuleInit() {
    const kafkaTopic =
      this.configService.get('KAFKA_TOPIC_WER', { infer: true }) || '';
    this.kafkaClient.subscribeToResponseOf(kafkaTopic);
    try {
      await this.kafkaClient.connect();
      this.LOGGER.log(`Connection to '${kafkaTopic}' topic established`);
    } catch (error) {
      this.LOGGER.error(`Kafka connection error: ${error}`);
      throw new KafkaConnectionException(
        'WorkflowExecutionRequestQueue',
        error,
      );
    }
  }

  @EventPattern(process.env.KAFKA_TOPIC_WER)
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
      throw new CannotRunNewWorkflowExecutionException(request.executionId);
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
