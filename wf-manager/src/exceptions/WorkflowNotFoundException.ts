import { HttpStatus } from '@nestjs/common';
import WorkflowException from './WorkflowException';

class WorkflowNotFoundException extends WorkflowException {
  private static readonly NAME = 'WorkflowNotFoundException';

  constructor(private readonly workflowName: string) {
    super(
      WorkflowNotFoundException.NAME,
      `Workflow '${workflowName}' not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export default WorkflowNotFoundException;
