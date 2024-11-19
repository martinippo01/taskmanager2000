import WorkflowError from './WorkflowError.js';

class WorkflowAlreadyExistsError extends WorkflowError {
  private static readonly _name: string = 'WorkflowAlreadyExistsError';

  constructor(workflowName: string) {
    super(
      WorkflowAlreadyExistsError._name,
      `Workflow with name ${workflowName} already exists`
    );
  }
}

export default WorkflowAlreadyExistsError;
