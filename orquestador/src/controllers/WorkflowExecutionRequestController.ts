import { CannotRunNewWorkflowExecutionException } from '@exceptions/CannotRunNewWorkflowExecution';
import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';
import { KafkaWorkflowExecutionRequestClient } from '@configs/KafkaWorkflowExecutionRequestConfig';
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
  KAFKA_TOPIC_WER: string;
};

@Controller()
export class WorkflowExecutionRequestController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionRequestController.name);

  constructor(
    @Inject(KafkaWorkflowExecutionRequestClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionDomain)
    private readonly workflowExecutionDomain: WorkflowExecutionDomain,
    private readonly configService: ConfigService<KafkaEnvironmentVariables>,
  ) {}

  async onModuleInit() {
    const kafkaTopic =
      this.configService.get('KAFKA_TOPIC_WER', { infer: true }) || '';
    this.kafkaClient.subscribeToResponseOf(kafkaTopic);
    await this.kafkaClient.connect();
  }

  @EventPattern(process.env.KAFKA_TOPIC_WER)
  async handleExecutionRequest(
    @Payload() request: WorkflowExecutionRequest,
    @Ctx() context: KafkaContext,
  ) {
    this.LOGGER.debug(
      `Received workflow execution request with id: ${request.executionId}`,
    );
    const { alreadyRunned, couldRun } =
      await this.workflowExecutionDomain.runNewWorkflowExecution(request);
    if (!alreadyRunned && !couldRun) {
      throw new CannotRunNewWorkflowExecutionException(request.executionId);
    }
    if (alreadyRunned) {
      this.LOGGER.warn(
        `Workflow execution request with id: ${request.executionId} has already been runned`,
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
