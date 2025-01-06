import { KafkaStepScheduleRequestClient } from '@configs/KafkaStepScheduleRequestConfig';
import { SchedulerDomain } from '@interfaces/domains/SchedulerDomain';
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

type KafkaEnvironmentVariables = {
  KAFKA_TOPIC_SSR: string;
};

@Controller()
export class WorkflowExecutionStepController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionStepController.name);

  constructor(
    @Inject(KafkaStepScheduleRequestClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(SchedulerDomain) private readonly schedulerDomain: SchedulerDomain,
    private readonly configService: ConfigService<KafkaEnvironmentVariables>,
  ) {}

  async onModuleInit() {
    const topic = this.configService.get('KAFKA_TOPIC_SSR', { infer: true });
    this.kafkaClient.subscribeToResponseOf(topic);
    this.kafkaClient.connect();
  }

  @EventPattern(process.env.KAFKA_TOPIC_SSR)
  async handleWorkflowExecutionStep(
    @Payload() request: StepScheduleRequest,
    @Ctx() context: KafkaContext,
  ) {
    this.LOGGER.log(
      `Received step schedule request from workflow execution with id: ${request.workflowExecutionId}`,
    );
  }
}
