import { HttpStatus } from '@nestjs/common';
import OrquestadorException from './OrquestadorException';

class WorkflowNotFoundException extends OrquestadorException {
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
