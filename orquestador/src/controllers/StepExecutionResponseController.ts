import {
  KafkaStepExecutionResponseClient,
  KafkaStepExecutionResponseEnvironmentVariables,
} from '@configs/KafkaStepExecutionResponseConfig';
import { WorkflowExecutionStepDomain } from '@interfaces/domains/WorkflowExecutionStepDomain';
import { Controller, Inject, Logger, OnModuleInit } from '@nestjs/common';
import {
  ClientKafka,
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import KafkaConnectionException from '@exceptions/KakfaConnectionException';
import { WorkflowExecutionStepRequest } from '@shared/WorkflowExecutionStepRequest';

@Controller()
export class StepExecutionResponseController implements OnModuleInit {
  private readonly LOGGER = new Logger(StepExecutionResponseController.name);

  constructor(
    @Inject(KafkaStepExecutionResponseClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionStepDomain)
    private readonly workflowExecutionStepDomain: WorkflowExecutionStepDomain,
    @Inject(ConfigService)
    private readonly configService: ConfigService<KafkaStepExecutionResponseEnvironmentVariables>,
  ) {}

  async onModuleInit() {
    this.LOGGER.log('WorkflowExecutionStepController initialized');
    const kafkaTopic =
      this.configService.get('KAFKA_TOPIC_SER', { infer: true }) || '';
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

  @EventPattern(process.env.KAFKA_TOPIC_SER) // CHANGE THIS!!!! TO THE PROPER TOPIC AND EVERYTHING
  async taskCompleted(
    @Payload() request: WorkflowExecutionStepRequest,
    @Ctx() context: KafkaContext,
  ) {
    this.LOGGER.debug('Task completed');
    await this.workflowExecutionStepDomain.runNextStep(request.executionId);
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
