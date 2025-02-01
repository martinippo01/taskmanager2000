import { HttpStatus } from '@nestjs/common';
import OrchestatorHttpException from './OrchestatorHttpException';

class NotAliveException extends OrchestatorHttpException {
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
