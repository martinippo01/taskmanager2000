import { CannotRunNewWorkflowExecutionException } from '@exceptions/CannotRunNewWorkflowExecution';
import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';
import {
  KafkaWorkflowExecutionRequestClient,
  KafkaWorkflowExecutionRequestEnvironmentVariables,
} from '@configs/KafkaWorkflowExecutionRequestConfig';
import { Controller, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { WorkflowExecutionRequest } from '@shared/WorkflowExecutionRequest';
import KafkaConnectionException from '@exceptions/KakfaConnectionException';
import { TracerGateway } from '@shared/TracerGateway';

@Controller()
export class WorkflowExecutionRequestController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionRequestController.name);

  constructor(
    @Inject(KafkaWorkflowExecutionRequestClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionDomain)
    private readonly workflowExecutionDomain: WorkflowExecutionDomain,
    @Inject(ConfigService)
    private readonly configService: ConfigService<KafkaWorkflowExecutionRequestEnvironmentVariables>,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async onModuleInit() {
    const kafkaTopic =
      this.configService.get('KAFKA_TOPIC_WER', { infer: true }) || '';
    // this.kafkaClient.subscribeToResponseOf(kafkaTopic);
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
    //@Ctx() context: KafkaContext,
  ) {
    return this.tracerGateway.trace(
      'WorkflowExecutionRequestController.handleExecutionRequest',
      async (span) => {
        span.setAttribute('workflow.execution.id', request.executionId);
        span.setAttribute('workflow.name', request.name);
        this.LOGGER.debug(
          `Received workflow execution request with id: ${request.executionId}`,
        );
        const { alreadyRun, couldRun } =
          await this.workflowExecutionDomain.runNewWorkflowExecution(request);
        span.setAttribute('workflow.execution.alreadyRun', alreadyRun);
        span.setAttribute('workflow.execution.couldRun', couldRun);
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

        /*
        try {
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
        } catch (error) {
          span.addEvent('Failed to commit offset');
          this.LOGGER.error(
            `Failed to commit offset for request with id: ${request.executionId}`,
          );
          throw error;
        }*/
      },
    );
  }
}
