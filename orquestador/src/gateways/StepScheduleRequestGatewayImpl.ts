import { KafkaStepScheduleRequestClient } from '@configs/KafkaStepScheduleRequestConfig';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';

type KafkaEnvironmentVariables = {
  KAFKA_TOPIC_SSR: string;
};

@Injectable()
export class StepScheduleRequestGatewayImpl
  implements StepScheduleRequestGateway, OnModuleInit
{
  private readonly LOGGER = new Logger(StepScheduleRequestGatewayImpl.name);
  private readonly topic: string;

  constructor(
    @Inject(KafkaStepScheduleRequestClient)
    private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService<KafkaEnvironmentVariables>,
  ) {
    this.topic =
      this.configService.get('KAFKA_TOPIC_SSR', { infer: true }) || '';
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  queueStep(stepScheduleRequest: StepScheduleRequest): Promise<boolean> {
    this.LOGGER.debug(
      `Queuing step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}'`,
    );
    return new Promise((resolve, reject) => {
      this.kafkaClient.emit(this.topic, stepScheduleRequest).subscribe({
        complete: () => {
          this.LOGGER.debug(
            `Step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}' queued successfully`,
          );
          resolve(true);
        },
        error: (error) => {
          this.LOGGER.error(
            `Failed to queue step schedule request '${stepScheduleRequest.name}' from workflow execution '${stepScheduleRequest.workflowExecutionId}'`,
          );
          reject(error);
        },
      });
    });
  }
}
