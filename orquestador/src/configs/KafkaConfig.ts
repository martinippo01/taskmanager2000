import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

export const KafkaClient = Symbol('KafkaClient');

type KafkaEnvironmentVariables = {
  KAFKA_BROKERS: string;
  KAFKA_CLIENT_ID: string;
  KAFKA_USERNAME: string;
  KAFKA_PASSWORD: string;
  KAFKA_GROUP_ID: string;
};

export const getKafkaConfig = ({
  brokers = [],
  clientId = 'orquestador',
  username = '',
  password = '',
  groupId = 'orquestador',
}: {
  brokers?: string[];
  clientId?: string;
  username?: string;
  password?: string;
  groupId?: string;
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
    consumer: {
      allowAutoTopicCreation: true,
      groupId,
    },
    run: {
      autoCommit: false,
    },
    subscribe: {
      fromBeginning: false,
    },
  },
});

export const kafkaClientFactoryProvider = (
  configService: ConfigService<KafkaEnvironmentVariables>,
): ClientOptions => {
  const brokers =
    configService.get('KAFKA_BROKERS', { infer: true })?.split(',') || [];
  const clientId =
    configService.get('KAFKA_CLIENT_ID', { infer: true }) || 'orquestador';
  const username = configService.get('KAFKA_USERNAME', { infer: true }) || '';
  const password = configService.get('KAFKA_PASSWORD', { infer: true }) || '';
  const groupId =
    configService.get('KAFKA_GROUP_ID', { infer: true }) || 'orquestador';
  return getKafkaConfig({
    brokers,
    clientId,
    username,
    password,
    groupId,
  });
};
