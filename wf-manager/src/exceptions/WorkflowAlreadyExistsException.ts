import WorkflowException from './WorkflowException';
import { HttpStatus } from '@nestjs/common';

class WorkflowAlreadyExistsException extends WorkflowException {
  private static readonly NAME: string = 'WorkflowAlreadyExistsException';

  constructor(private readonly workflowName: string) {
    super(
      WorkflowAlreadyExistsException.NAME,
      `Workflow with name '${workflowName}' already exists`,
      HttpStatus.CONFLICT,
    );
  }
}

export default WorkflowAlreadyExistsException;
