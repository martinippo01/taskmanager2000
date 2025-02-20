import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestEnvironmentVariables,
} from '@configs/KafkaStepScheduleRequestConfig';
import KafkaConnectionException from '@exceptions/KakfaConnectionException';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class StepScheduleRequestGatewayImpl
  implements StepScheduleRequestGateway, OnModuleInit
{
  private readonly LOGGER = new Logger(StepScheduleRequestGatewayImpl.name);
  private readonly topic: string;

  constructor(
    @Inject(KafkaStepScheduleRequestClient)
    private readonly kafkaClient: ClientKafka,
    @Inject(ConfigService)
    private readonly configService: ConfigService<KafkaStepScheduleRequestEnvironmentVariables>,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {
    this.topic =
      this.configService.get('KAFKA_TOPIC_SSR', { infer: true }) || '';
  }

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.LOGGER.log(`Connection to Kafka topic ${this.topic} established`);
    } catch (error) {
      this.LOGGER.error(`Kafka connection error: ${error}`);
      throw new KafkaConnectionException('StepScheduleRequestQueue', error);
    }
  }

  async queueStep(stepScheduleRequest: StepScheduleRequest): Promise<
    | {
        queued: true;
      }
    | {
        queued: false;
        error: unknown;
      }
  > {
    return this.tracerGateway.trace(
      'StepScheduleRequestGatewayImpl.queueStep',
      async (span) => {
        span.setAttribute('step.name', stepScheduleRequest.name);
        span.setAttribute(
          'workflow.execution.id',
          stepScheduleRequest.workflowExecutionId,
        );
        this.LOGGER.debug(
          `Queuing step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}'`,
        );
        return new Promise((resolve) => {
          this.kafkaClient.emit(this.topic, stepScheduleRequest).subscribe({
            complete: () => {
              this.LOGGER.debug(
                `Step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}' queued successfully`,
              );
              span.setAttribute('step.schedule.request.queued', true);
              resolve({ queued: true });
            },
            error: (error) => {
              this.LOGGER.error(
                `Failed to queue step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}'`,
              );
              span.setAttribute('step.schedule.request.queued', false);
              resolve({ queued: false, error });
            },
          });
        });
      },
    );
  }
}
