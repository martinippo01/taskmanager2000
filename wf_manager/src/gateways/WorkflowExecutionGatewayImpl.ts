import { WorkflowExecution } from '@interfaces/Workflow.js';
import WorkflowExecutionGateway from '@interfaces/WorkflowExecutionGateway.js';

class WorkflowExecutionGatewayImpl implements WorkflowExecutionGateway {
  executeWorkflow(workflow: WorkflowExecution): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowExecutionGatewayImpl;
