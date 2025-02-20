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
import { TracerGateway } from '@shared/TracerGateway';

@Controller()
export class StepExecutionResponseController implements OnModuleInit {
  private readonly LOGGER = new Logger(StepExecutionResponseController.name);
  private hashSet: Set<string>;

  constructor(
    @Inject(KafkaStepExecutionResponseClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionStepDomain)
    private readonly workflowExecutionStepDomain: WorkflowExecutionStepDomain,
    @Inject(ConfigService)
    private readonly configService: ConfigService<KafkaStepExecutionResponseEnvironmentVariables>,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
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

  @EventPattern(process.env.KAFKA_TOPIC_SER)
  async taskCompleted(
    @Payload() request: WorkflowExecutionStepRequest,
    @Ctx() context: KafkaContext,
  ) {
    return this.tracerGateway.trace(
      'StepExecutionResponseController.taskCompleted',
      async (span) => {
        span.setAttribute('workflow.execution.id', request.executionId);
        span.setAttribute('workflow.execution.answer', request.answer);
        span.setAttribute('workflow.execution.name', request.name);

        this.LOGGER.debug(
          `Task completed, executionId: ${request.executionId}`,
        );
        this.LOGGER.debug(`Answer: ${request.answer}`);
        await this.workflowExecutionStepDomain.saveAnswer(
          request.executionId,
          request.answer,
          request.name,
        );
        span.setAttribute('workflow.execution.answer.saved', true);
        await this.workflowExecutionStepDomain.runNextStep(request.executionId);
        span.setAttribute('workflow.execution.next.step.started', true);
        this.LOGGER.debug(
          `Committing offset for request with id: ${request.executionId}`,
        );

        try {
          const { offset } = context.getMessage();
          const partition = context.getPartition();
          const topic = context.getTopic();
          const consumer = context.getConsumer();
          await consumer.commitOffsets([{ topic, partition, offset }]);
          this.LOGGER.debug(
            `Offset committed for request with id: ${request.executionId}`,
          );
        } catch (error) {
          span.addEvent('Failed to commit offset');
          this.LOGGER.error(
            `Failed to commit offset for request with id: ${request.executionId}`,
          );
          throw error;
        }
      },
    );
  }
}
