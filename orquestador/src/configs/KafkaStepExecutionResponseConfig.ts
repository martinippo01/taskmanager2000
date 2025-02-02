import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

export const KafkaStepExecutionResponseClient = Symbol(
  'KafkaStepExecutionResponseClient',
);

export type KafkaStepExecutionResponseEnvironmentVariables = {
  KAFKA_BROKERS_SER: string;
  KAFKA_CLIENT_ID_SER: string;
  KAFKA_GROUP_ID_SER: string;
  KAFKA_USERNAME_SER: string;
  KAFKA_PASSWORD_SER: string;
  KAFKA_TOPIC_SER: string;
};

export const getKafkaStepExecutionResponseConfig = ({
  brokers = [],
  clientId = 'scheduler',
  groupId = 'scheduler',
  username = '',
  password = '',
}: {
  brokers?: string[];
  clientId?: string;
  groupId?: string;
  username?: string;
  password?: string;
} = {}): ClientOptions => ({
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
    consumer: {
      groupId,
      allowAutoTopicCreation: true,
    },
    run: {
      autoCommit: false,
    },
    subscribe: {
      fromBeginning: false,
    },
  },
});

export const KafkaStepExecutionResponseClientFactoryProvider = (
  configService: ConfigService<KafkaStepExecutionResponseEnvironmentVariables>,
): ClientOptions => {
  const brokers =
    configService.get('KAFKA_BROKERS_SER', { infer: true })?.split(',') ?? [];
  const clientId =
    configService.get('KAFKA_CLIENT_ID_SER', { infer: true }) ?? 'scheduler';
  const groupId =
    configService.get('KAFKA_GROUP_ID_SER', { infer: true }) ?? 'scheduler';
  const username =
    configService.get('KAFKA_USERNAME_SER', { infer: true }) ?? '';
  const password =
    configService.get('KAFKA_PASSWORD_SER', { infer: true }) ?? '';
  return getKafkaStepExecutionResponseConfig({
    brokers,
    clientId,
    groupId,
    username,
    password,
  });
};
