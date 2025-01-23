import { HttpStatus } from '@nestjs/common';
import OrchestatorHttpException from './OrchestatorHttpException';

export class WorkflowExecutionNotFoundException extends OrchestatorHttpException {
  private static readonly NAME = 'WorkflowExecutionNotFoundException';

  constructor(executionId: string) {
    super(
      WorkflowExecutionNotFoundException.NAME,
      `Workflow execution with id ${executionId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}
