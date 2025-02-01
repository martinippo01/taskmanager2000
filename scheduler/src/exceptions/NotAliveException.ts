import { HttpStatus } from '@nestjs/common';
import SchedulerHttpException from './SchedulerHttpException';

class NotAliveException extends SchedulerHttpException {
  private static readonly NAME: string = 'NotAliveException';

  constructor() {
    super(
      NotAliveException.NAME,
      `The health check has failed`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export default NotAliveException;
