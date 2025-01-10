import { HttpStatus } from '@nestjs/common';
import SchedulerHttpException from './SchedulerHttpException';
import { KafkaMessage } from 'kafkajs';

class KafkaCommitOffsetsException extends SchedulerHttpException {
  private static readonly NAME = 'KafkaCommitOffsetsException';

  constructor(message: KafkaMessage, cause: unknown) {
    super(
      KafkaCommitOffsetsException.NAME,
      `Failed to commit offsets for Kafka message: ${message}. `,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        cause,
      },
    );
  }
}

export default KafkaCommitOffsetsException;
