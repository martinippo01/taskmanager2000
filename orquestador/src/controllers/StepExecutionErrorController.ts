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
import { TracerGateway } from '@shared/TracerGateway';

@Controller()
export class StepExecutionErrorController implements OnModuleInit {
  private readonly LOGGER = new Logger(StepExecutionErrorController.name);

  constructor(
    @Inject(KafkaStepExecutionErrorClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionStepDomain)
    private readonly workflowExecutionStepDomain: WorkflowExecutionStepDomain,
    private readonly configService: ConfigService<KafkaStepExecutionErrorEnvironmentVariables>,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
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
    return this.tracerGateway.trace(
      'StepExecutionErrorController.handleStepExecutionError',
      async (span) => {
        span.setAttribute('workflow.execution.id', error.executionId);
        span.setAttribute('workflow.execution.reason', error.reason);
        this.LOGGER.debug(
          `Received step execution error with execution id ${error.executionId} from workflow execution with reason ${error.reason}`,
        );
        await this.workflowExecutionStepDomain.handleError(
          error.executionId,
          error.reason,
        ); // TODO: Check if we want to store the stepNum
        span.setAttribute('workflow.execution.step.error.handled', true);

        this.LOGGER.debug(
          `Committing offset for request with id: ${error.executionId}`,
        );
        try {
          const { offset } = context.getMessage();
          const partition = context.getPartition();
          const topic = context.getTopic();
          const consumer = context.getConsumer();
          await consumer.commitOffsets([{ topic, partition, offset }]);
          this.LOGGER.debug(
            `Offset committed for request with id: ${error.executionId}`,
          );
        } catch (error) {
          span.addEvent('Failed to commit offset');
          this.LOGGER.error(
            `Failed to commit offset for request with id: ${error.executionId}`,
          );
          throw error;
        }
      },
    );
  }
}
