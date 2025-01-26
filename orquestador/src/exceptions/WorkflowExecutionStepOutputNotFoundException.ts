import { HttpStatus } from '@nestjs/common';
import OrchestatorHttpException from './OrchestatorHttpException';

export class WorkflowExecutionStepOutputNotFoundException extends OrchestatorHttpException {
  private static readonly NAME = 'WorkflowExecutionStepOutputNotFoundException';

  constructor(executionId: string, stepName: string) {
    super(
      WorkflowExecutionStepOutputNotFoundException.NAME,
      `Step output for step ${stepName} in workflow execution with id ${executionId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}
