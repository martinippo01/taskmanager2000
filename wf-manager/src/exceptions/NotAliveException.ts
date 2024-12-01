import { HttpStatus } from '@nestjs/common';
import WorkflowException from './WorkflowException';

class NotAliveException extends WorkflowException {
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
