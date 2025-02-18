import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestEnvironmentVariables,
} from '@configs/KafkaStepScheduleRequestConfig';
import KafkaCommitOffsetsException from '@exceptions/KafkaCommitOffsetsException';
import KafkaConnectionException from '@exceptions/KafkaConnectionException';
import { SchedulerDomain } from '@interfaces/domains/SchedulerDomain';
import { StepScheduleExceptionOrchestratorGateway } from '@interfaces/gateways/StepScheduleExceptionOrchestratorGateway';
import { Controller, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientKafka,
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { TracerGateway } from '@shared/TracerGateway';

@Controller()
export class WorkflowExecutionStepController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionStepController.name);

  constructor(
    @Inject(KafkaStepScheduleRequestClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(SchedulerDomain) private readonly schedulerDomain: SchedulerDomain,
    @Inject(StepScheduleExceptionOrchestratorGateway)
    private readonly stepScheduleExceptionOrchestratorGateway: StepScheduleExceptionOrchestratorGateway,
    private readonly configService: ConfigService<KafkaStepScheduleRequestEnvironmentVariables>,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async onModuleInit() {
    const topic =
      this.configService.get('KAFKA_TOPIC_SSR', { infer: true }) || '';
    this.kafkaClient.subscribeToResponseOf(topic);
    try {
      await this.kafkaClient.connect();
      this.LOGGER.log(`Connection to Kafka topic ${topic} established`);
    } catch (error) {
      this.LOGGER.error(`Failed to connect to Kafka topic ${topic}`);
      throw new KafkaConnectionException(topic, error);
    }
  }

  @EventPattern(process.env.KAFKA_TOPIC_SSR)
  async handleWorkflowExecutionStep(
    @Payload() request: StepScheduleRequest,
    @Ctx() context: KafkaContext,
  ) {
    return this.tracerGateway.trace(
      'WorkflowExecutionStepController.handleWorkflowExecutionStep',
      async (span) => {
        span.setAttribute('step.name', request.name);
        span.setAttribute('workflow.execution.id', request.workflowExecutionId);
        this.LOGGER.debug(
          `Received step schedule request with name ${request.name} from workflow execution with id ${request.workflowExecutionId}`,
        );
        const { error } =
          await this.schedulerDomain.scheduleStepExecution(request);
        span.setAttribute('step.scheduled', !error);
        if (error) {
          this.LOGGER.error(
            `Failed to schedule step with name ${request.name} from workflow execution with id ${request.workflowExecutionId}`,
          );
          await this.stepScheduleExceptionOrchestratorGateway.notify(
            request,
            error,
          );
        } else {
          this.LOGGER.debug(
            `Step with name ${request.name} from workflow execution with id ${request.workflowExecutionId} scheduled successfully`,
          );
        }

        this.LOGGER.debug(
          `Commiting offset for step schedule request with name ${request.name} from workflow execution with id ${request.workflowExecutionId}`,
        );
        const message = context.getMessage();
        const { offset } = message;
        const partition = context.getPartition();
        const topic = context.getTopic();
        const consumer = context.getConsumer();
        try {
          await consumer.commitOffsets([{ topic, partition, offset }]);
          this.LOGGER.debug(
            `Offset commited for step schedule request with name ${request.name} from workflow execution with id ${request.workflowExecutionId}`,
          );
        } catch (error) {
          span.addEvent('Failed to commit offset');
          this.LOGGER.error(
            `Failed to commit offset for step schedule request with name ${request.name} from workflow execution with id ${request.workflowExecutionId}`,
          );
          throw new KafkaCommitOffsetsException(message, error);
        }
      },
    );
  }
}
