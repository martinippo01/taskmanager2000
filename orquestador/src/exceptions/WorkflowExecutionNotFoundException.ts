import { HttpStatus } from '@nestjs/common';
import OrquestadorException from './OrquestadorException';

class WorkflowExecutionNotFoundException extends OrquestadorException {
  private static readonly NAME = 'WorkflowNotFoundException';

  constructor(readonly name: string) {
    super(
      WorkflowExecutionNotFoundException.NAME,
      `Workflow execution with id ${name} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export default WorkflowExecutionNotFoundException;
