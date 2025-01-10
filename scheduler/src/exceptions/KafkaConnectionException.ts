import { HttpStatus } from '@nestjs/common';
import SchedulerHttpException from './SchedulerHttpException';

class KafkaConnectionException extends SchedulerHttpException {
  private static readonly NAME = 'KafkaConnectionException';

  constructor(kafkaQueue: string, cause: unknown) {
    super(
      KafkaConnectionException.NAME,
      `Failed to connect to Kafka queue: ${kafkaQueue}. `,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        cause,
      },
    );
  }
}

export default KafkaConnectionException;
