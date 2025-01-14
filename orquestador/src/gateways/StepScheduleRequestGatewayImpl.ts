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

@Injectable()
export class StepScheduleRequestGatewayImpl
  implements StepScheduleRequestGateway, OnModuleInit
{
  private readonly LOGGER = new Logger(StepScheduleRequestGatewayImpl.name);
  private readonly topic: string;

  constructor(
    @Inject(KafkaStepScheduleRequestClient)
    private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService<KafkaStepScheduleRequestEnvironmentVariables>,
  ) {
    this.topic =
      this.configService.get('KAFKA_TOPIC_SSR', { infer: true }) || '';
  }

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
    } catch (error) {
      this.LOGGER.error(`Kafka connection error: ${error}`);
      throw new KafkaConnectionException('StepScheduleRequestQueue', error);
    }
  }

  queueStep(stepScheduleRequest: StepScheduleRequest): Promise<
    | {
        queued: true;
      }
    | {
        queued: false;
        error: unknown;
      }
  > {
    this.LOGGER.debug(
      `Queuing step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}'`,
    );
    return new Promise((resolve) => {
      this.kafkaClient.emit(this.topic, stepScheduleRequest).subscribe({
        complete: () => {
          this.LOGGER.debug(
            `Step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}' queued successfully`,
          );
          resolve({ queued: true });
        },
        error: (error) => {
          this.LOGGER.error(
            `Failed to queue step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}'`,
          );
          resolve({ queued: false, error });
        },
      });
    });
  }
}
