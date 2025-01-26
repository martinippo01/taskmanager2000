import { HttpStatus } from '@nestjs/common';
import OrchestatorHttpException from './OrchestatorHttpException';

class CannotDeleteWorkflowExecutionException extends OrchestatorHttpException {
  private static readonly NAME = 'CannotDeleteWorkflowExecutionException';

  constructor(executionId: string, cause?: unknown) {
    super(
      CannotDeleteWorkflowExecutionException.NAME,
      `Cannot delete workflow execution with id ${executionId}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      { cause },
    );
  }
}

export default CannotDeleteWorkflowExecutionException;
