import OrchestatorRpcException from './OrchestatorRpcException';

export class CannotRunNewWorkflowExecutionException extends OrchestatorRpcException {
  private static readonly NAME = 'CannotRunNewWorkflowExecution';

  constructor(wfExecutionId: string) {
    super(
      CannotRunNewWorkflowExecutionException.NAME,
      `Cannot run new workflow execution with id: ${wfExecutionId}`,
    );
  }
}
