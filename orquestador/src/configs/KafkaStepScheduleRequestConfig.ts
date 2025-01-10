import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

export const KafkaStepScheduleRequestClient = Symbol(
  'KafkaStepScheduleRequestClient',
);

export type KafkaStepScheduleRequestEnvironmentVariables = {
  KAFKA_BROKERS_SSR: string;
  KAFKA_CLIENT_ID_SSR: string;
  KAFKA_USERNAME_SSR: string;
  KAFKA_PASSWORD_SSR: string;
  KAFKA_TOPIC_SSR: string;
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
    configService.get('KAFKA_BROKERS_SSR', { infer: true })?.split(',') || [];
  const clientId =
    configService.get('KAFKA_CLIENT_ID_SSR', { infer: true }) || '';
  const username =
    configService.get('KAFKA_USERNAME_SSR', { infer: true }) || '';
  const password =
    configService.get('KAFKA_PASSWORD_SSR', { infer: true }) || '';
  return getKafkaStepScheduleRequestConfig({
    brokers,
    clientId,
    username,
    password,
  });
};
