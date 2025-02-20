import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

export const KafkaWorkflowExecutionRequestClient = Symbol(
  'KafkaWorkflowExecutionRequestClient',
);

export type KafkaWorkflowExecutionRequestEnvironmentVariables = {
  KAFKA_BROKERS_WER: string;
  KAFKA_CLIENT_ID_WER: string;
  KAFKA_USERNAME_WER: string;
  KAFKA_PASSWORD_WER: string;
  KAFKA_GROUP_ID_WER: string;
  KAFKA_TOPIC_WER: string;
};

export const getKafkaWorkflowExecutionRequestConfig = ({
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
      autoCommit: true,
    },
    subscribe: {
      fromBeginning: false,
    },
  },
});

export const kafkaWorkflowExecutionRequestClientFactoryProvider = (
  configService: ConfigService<KafkaWorkflowExecutionRequestEnvironmentVariables>,
): ClientOptions => {
  const brokers =
    configService.get('KAFKA_BROKERS_WER', { infer: true })?.split(',') || [];
  const clientId =
    configService.get('KAFKA_CLIENT_ID_WER', { infer: true }) || 'orquestador';
  const username =
    configService.get('KAFKA_USERNAME_WER', { infer: true }) || '';
  const password =
    configService.get('KAFKA_PASSWORD_WER', { infer: true }) || '';
  const groupId =
    configService.get('KAFKA_GROUP_ID_WER', { infer: true }) || 'orquestador';
  return getKafkaWorkflowExecutionRequestConfig({
    brokers,
    clientId,
    username,
    password,
    groupId,
  });
};
