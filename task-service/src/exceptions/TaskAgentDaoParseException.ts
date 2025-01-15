import { HttpStatus } from '@nestjs/common';
import TaskServiceException from './TaskServiceException';

class TaskAgentDaoParseException extends TaskServiceException {
  private static readonly NAME = 'TaskAgentDaoParseException';

  constructor(message: string) {
    super(
      TaskAgentDaoParseException.NAME,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export default TaskAgentDaoParseException;
