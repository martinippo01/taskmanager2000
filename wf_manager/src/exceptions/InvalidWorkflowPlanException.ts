import WorkflowException from './WorkflowException';
import { HttpStatus } from '@nestjs/common';

class InvalidWorkflowPlanException extends WorkflowException {
  private static readonly NAME = 'InvalidWorkflowPlanException';

  constructor() {
    super(
      InvalidWorkflowPlanException.NAME,
      'Workflow plan is invalid',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export default InvalidWorkflowPlanException;
