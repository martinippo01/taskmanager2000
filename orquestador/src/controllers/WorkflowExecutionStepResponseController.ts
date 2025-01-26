import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestEnvironmentVariables,
} from '@configs/KafkaStepScheduleRequestConfig';
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
export class WorkflowExecutionStepResponseController implements OnModuleInit {
  private readonly LOGGER = new Logger(
    WorkflowExecutionStepResponseController.name,
  );

  constructor(
    @Inject(KafkaStepScheduleRequestClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionStepDomain)
    private readonly workflowExecutionStepDomain: WorkflowExecutionStepDomain,
    @Inject(ConfigService)
    private readonly configService: ConfigService<KafkaStepScheduleRequestEnvironmentVariables>,
  ) {}

  async onModuleInit() {
    this.LOGGER.log('WorkflowExecutionStepController initialized');
    const kafkaTopic =
      this.configService.get('KAFKA_TOPIC_SSR', { infer: true }) || '';
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

  @EventPattern(process.env.KAFKA_TOPIC_SSR)
  async taskCompleted(
    @Payload() request: WorkflowExecutionStepRequest,
    @Ctx() context: KafkaContext,
  ) {
    this.LOGGER.debug('Task completed');
    await this.workflowExecutionStepDomain.runNextStep(request.executionId);
  }
}
