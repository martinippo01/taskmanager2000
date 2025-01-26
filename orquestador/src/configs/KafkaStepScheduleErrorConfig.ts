import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

export const KafkaStepScheduleRequestClient = Symbol(
  'KafkaStepScheduleRequestClient',
);

export type KafkaStepScheduleRequestEnvironmentVariables = {
  KAFKA_BROKERS_SSE: string;
  KAFKA_CLIENT_ID_SSE: string;
  KAFKA_USERNAME_SSE: string;
  KAFKA_PASSWORD_SSE: string;
  KAFKA_TOPIC_SSE: string;
};

export const getKafkaStepScheduleRequestConfig = ({
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

export const KafkaStepScheduleRequestClientFactoryProvider = (
  configService: ConfigService<KafkaStepScheduleRequestEnvironmentVariables>,
): ClientOptions => {
  const brokers =
    configService.get('KAFKA_BROKERS_SSE', { infer: true })?.split(',') || [];
  const clientId =
    configService.get('KAFKA_CLIENT_ID_SSE', { infer: true }) || '';
  const username =
    configService.get('KAFKA_USERNAME_SSE', { infer: true }) || '';
  const password =
    configService.get('KAFKA_PASSWORD_SSE', { infer: true }) || '';
  return getKafkaStepScheduleRequestConfig({
    brokers,
    clientId,
    username,
    password,
  });
};
