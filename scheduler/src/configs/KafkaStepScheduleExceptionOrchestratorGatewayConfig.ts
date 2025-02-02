import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

export const KafkaStepScheduleExceptionOrchestratorGatewayClient = Symbol(
  'KafkaStepScheduleExceptionOrchestratorGatewayClient',
);

export type KafkaStepScheduleExceptionOrchestratorGatewayEnvironmentVariables =
  {
    KAFKA_BROKERS_SEE: string;
    KAFKA_CLIENT_ID_SEE: string;
    KAFKA_USERNAME_SEE: string;
    KAFKA_PASSWORD_SEE: string;
    KAFKA_TOPIC_SEE: string;
  };

export const getKafkaStepScheduleExceptionOrchestratorGatewayConfig = ({
  brokers = [],
  clientId = 'orquestador',
  username = '',
  password = '',
}: {
  brokers?: string[];
  clientId?: string;
  username?: string;
  password?: string;
}): ClientOptions => ({
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers,
      clientId,
      ssl: false,
      sasl: {
        mechanism: 'plain',
        username,
        password,
      },
      logLevel: logLevel.ERROR,
    },
    producerOnlyMode: true,
    producer: {
      allowAutoTopicCreation: true,
    },
  },
});

export const KafkaStepScheduleExceptionOrchestratorGatewayClientFactoryProvider =
  (
    configService: ConfigService<KafkaStepScheduleExceptionOrchestratorGatewayEnvironmentVariables>,
  ): ClientOptions => {
    const brokers =
      configService.get('KAFKA_BROKERS_SEE', { infer: true })?.split(',') || [];
    const clientId =
      configService.get('KAFKA_CLIENT_ID_SEE', { infer: true }) || '';
    const username =
      configService.get('KAFKA_USERNAME_SEE', { infer: true }) || '';
    const password =
      configService.get('KAFKA_PASSWORD_SEE', { infer: true }) || '';
    return getKafkaStepScheduleExceptionOrchestratorGatewayConfig({
      brokers,
      clientId,
      username,
      password,
    });
  };
