import KafkaConnectionException from '@exceptions/KakfaConnectionException';
import { Controller, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowExecutionStepDomain } from '@interfaces/domains/WorkflowExecutionStepDomain';
import { WorkflowExecutionStepError } from '@shared/WorkflowExecutionStepError';
import {
  KafkaStepExecutionErrorClient,
  KafkaStepExecutionErrorEnvironmentVariables,
} from '@configs/KafkaStepExecutionErrorConfig';
import {
  ClientKafka,
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class StepExecutionErrorController implements OnModuleInit {
  private readonly LOGGER = new Logger(StepExecutionErrorController.name);

  constructor(
    @Inject(KafkaStepExecutionErrorClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionStepDomain)
    private readonly workflowExecutionStepDomain: WorkflowExecutionStepDomain,
    private readonly configService: ConfigService<KafkaStepExecutionErrorEnvironmentVariables>,
  ) {}

  async onModuleInit() {
    const topic =
      this.configService.get('KAFKA_TOPIC_SEE', { infer: true }) || '';
    this.kafkaClient.subscribeToResponseOf(topic);
    try {
      await this.kafkaClient.connect();
      this.LOGGER.log(`Connection to Kafka topic ${topic} established`);
    } catch (error) {
      this.LOGGER.error(`Failed to connect to Kafka topic ${topic}`);
      throw new KafkaConnectionException(topic, error);
    }
  }

  @EventPattern(process.env.KAFKA_TOPIC_SEE)
  async handleStepExecutionError(
    @Payload() error: WorkflowExecutionStepError,
    @Ctx() context: KafkaContext,
  ) {
    this.LOGGER.debug(
      `Received step execution error with execution id ${error.executionId} from workflow execution with reason ${error.reason}`,
    );
    this.workflowExecutionStepDomain.handleError(
      error.executionId,
      error.reason,
    ); // TODO: Check if we want to store the stepNum

    this.LOGGER.debug(
      `Committing offset for request with id: ${error.executionId}`,
    );
    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    const consumer = context.getConsumer();
    await consumer.commitOffsets([{ topic, partition, offset }]);
    this.LOGGER.debug(
      `Offset committed for request with id: ${error.executionId}`,
    );
  }
}
