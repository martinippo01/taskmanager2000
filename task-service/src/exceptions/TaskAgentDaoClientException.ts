import { HttpStatus } from '@nestjs/common';
import TaskServiceException from './TaskServiceException';

class TaskAgentDaoClientException extends TaskServiceException {
  private static readonly NAME = 'TaskAgentDaoClientException';

  constructor(message: string, error?: unknown) {
    super(
      TaskAgentDaoClientException.NAME,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      error,
    );
  }
}

export default TaskAgentDaoClientException;
