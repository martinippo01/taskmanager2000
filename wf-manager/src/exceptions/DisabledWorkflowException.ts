import { HttpStatus } from '@nestjs/common';
import WorkflowException from './WorkflowException';

class DisabledWorkflowException extends WorkflowException {
  private static readonly NAME = 'DisabledWorkflowException';

  constructor(name: string) {
    super(
      DisabledWorkflowException.NAME,
      `Workflow '${name}' is disabled`,
      HttpStatus.CONFLICT,
    );
  }
}

export default DisabledWorkflowException;
