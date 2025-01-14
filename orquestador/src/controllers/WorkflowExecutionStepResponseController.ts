import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestEnvironmentVariables,
} from '@configs/KafkaStepScheduleRequestConfig';
import { WorkflowExecutionStepDomainImpl } from '@domains/WorkflowExecutionStepDomainImpl';
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

@Controller()
export class WorkflowExecutionStepResponseController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionStepResponseController.name);

  constructor(
    @Inject(KafkaStepScheduleRequestClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(WorkflowExecutionStepDomainImpl)
    private readonly workflowExecutionStepDomain: WorkflowExecutionStepDomainImpl,
    private readonly configService: ConfigService<KafkaStepScheduleRequestEnvironmentVariables>,
  ) {}

  async onModuleInit() {
    this.LOGGER.log('WorkflowExecutionStepController initialized');
    const kafkaTopic = this.configService.get('???', { infer: true }) || '';
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

  @EventPattern(process.env.???)
  async taskCompleted(
    @Payload() request: ???,
    @Ctx() context: KafkaContext,
  ){
    this.LOGGER.debug('Task completed');
    await this.workflowExecutionStepDomain.runNextStep(request.executionId);
  }
}
