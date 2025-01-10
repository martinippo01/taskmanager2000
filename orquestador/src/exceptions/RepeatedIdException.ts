import OrchestatorRpcException from './OrchestatorRpcException';

export class RepeatedIdException extends OrchestatorRpcException {
  private static readonly NAME = 'CannotRunNewWorkflowExecution';

  constructor(wfExecutionId: string) {
    super(
      RepeatedIdException.NAME,
      `Cannot save new workflow execution with id: ${wfExecutionId}, as there's another
      one with the exact same id`,
    );
  }
}
