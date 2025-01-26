import { HttpStatus } from '@nestjs/common';
import OrquestadorException from './OrquestadorException';

class WorkflowNotFoundException extends OrquestadorException {
  private static readonly NAME = 'WorkflowNotFoundException';

  constructor(readonly name: string) {
    super(
      WorkflowNotFoundException.NAME,
      `Workflow named ${name} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export default WorkflowNotFoundException;
