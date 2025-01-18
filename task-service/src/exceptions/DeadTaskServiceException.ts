import { HttpStatus } from '@nestjs/common';
import TaskServiceException from './TaskServiceException';

class DeadTaskServiceException extends TaskServiceException {
  private static readonly NAME = 'DeadTaskServiceException';

  constructor() {
    super(
      DeadTaskServiceException.NAME,
      'Task service health check failed',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export default DeadTaskServiceException;
