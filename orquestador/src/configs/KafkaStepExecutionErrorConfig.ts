import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

export const KafkaStepExecutionErrorClient = Symbol(
  'KafkaStepExecutionErrorClient',
);

export type KafkaStepExecutionErrorEnvironmentVariables = {
  KAFKA_BROKERS_SEE: string;
  KAFKA_CLIENT_ID_SEE: string;
  KAFKA_GROUP_ID_SEE: string;
  KAFKA_USERNAME_SEE: string;
  KAFKA_PASSWORD_SEE: string;
  KAFKA_TOPIC_SEE: string;
};

export const getKafkaStepExecutionErrorConfig = ({
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

export const KafkaStepExecutionErrorClientFactoryProvider = (
  configService: ConfigService<KafkaStepExecutionErrorEnvironmentVariables>,
): ClientOptions => {
  const brokers =
    configService.get('KAFKA_BROKERS_SEE', { infer: true })?.split(',') ?? [];
  const clientId =
    configService.get('KAFKA_CLIENT_ID_SEE', { infer: true }) ?? 'scheduler';
  const groupId =
    configService.get('KAFKA_GROUP_ID_SEE', { infer: true }) ?? 'scheduler';
  const username =
    configService.get('KAFKA_USERNAME_SEE', { infer: true }) ?? '';
  const password =
    configService.get('KAFKA_PASSWORD_SEE', { infer: true }) ?? '';
  return getKafkaStepExecutionErrorConfig({
    brokers,
    clientId,
    groupId,
    username,
    password,
  });
};
