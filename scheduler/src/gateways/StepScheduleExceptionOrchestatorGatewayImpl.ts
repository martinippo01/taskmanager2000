import KafkaConnectionException from '@exceptions/KafkaConnectionException';
import { StepScheduleExceptionOrchestratorGateway } from '@interfaces/gateways/StepScheduleExceptionOrchestratorGateway';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { StepScheduleException } from '@shared/StepScheduleException';
import {
  KafkaStepScheduleExceptionOrchestratorGatewayClient,
  KafkaStepScheduleExceptionOrchestratorGatewayEnvironmentVariables,
} from '@configs/KafkaStepScheduleExceptionOrchestratorGatewayConfig';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { WorkflowExecutionStepError } from '@shared/WorkflowExecutionStepError';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class StepScheduleExceptionOrchestratorGatewayImpl
  implements StepScheduleExceptionOrchestratorGateway, OnModuleInit
{
  private readonly LOGGER = new Logger(
    StepScheduleExceptionOrchestratorGatewayImpl.name,
  );
  private readonly topic: string;

  constructor(
    @Inject(KafkaStepScheduleExceptionOrchestratorGatewayClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(ConfigService)
    private readonly configService: ConfigService<KafkaStepScheduleExceptionOrchestratorGatewayEnvironmentVariables>,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {
    this.topic =
      this.configService.get('KAFKA_TOPIC_SEE', { infer: true }) || '';
  }

  async notify(
    request: StepScheduleRequest,
    exception: StepScheduleException,
  ): Promise<void> {
    return this.tracerGateway.trace(
      'StepScheduleExceptionOrchestratorGatewayImpl.notify',
      async (span) => {
        span.setAttribute('step.name', request.name);
        span.setAttribute('workflow.execution.id', request.workflowExecutionId);
        span.setAttribute('exception', exception);
        try {
          const payload: WorkflowExecutionStepError = {
            executionId: request.workflowExecutionId,
            reason: exception,
          };
          await this.kafkaClient.emit(this.topic, payload).toPromise();
          this.LOGGER.log(
            `Successfully notified exception for request: ${request.workflowExecutionId}`,
          );
        } catch (error) {
          span.addEvent('Failed to notify exception');
          this.LOGGER.error(
            `Failed to notify exception for request: ${request.workflowExecutionId}, error: ${error}`,
          );
          throw new KafkaConnectionException(
            'StepScheduleExceptionQueue',
            error,
          );
        }
      },
    );
  }

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
    } catch (error) {
      this.LOGGER.error(`Kafka connection error: ${error}`);
      throw new KafkaConnectionException('StepScheduleExceptionQueue', error);
    }
  }
}
