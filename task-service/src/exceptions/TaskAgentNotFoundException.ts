import { HttpStatus } from '@nestjs/common';
import TaskServiceException from './TaskServiceException';

class TaskAgentNotFoundException extends TaskServiceException {
  private static readonly NAME = 'TaskAgentNotFoundException';

  constructor(taskName: string) {
    super(
      TaskAgentNotFoundException.NAME,
      `Task agent '${taskName}' not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export default TaskAgentNotFoundException;
