import { HttpStatus } from '@nestjs/common';
import OrchestatorException from './OrchestatorException';

export class CannotRunNewWorkflowExecution extends OrchestatorException {
  private static readonly NAME = 'CannotRunNewWorkflowExecution';

  constructor(wfExecutionId: string) {
    super(
      CannotRunNewWorkflowExecution.NAME,
      `Cannot run new workflow execution with id: ${wfExecutionId}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
