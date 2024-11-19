import { WorkflowExecution } from './Workflow.js';

interface WorkflowExecutionGateway {
  executeWorkflow(workflow: WorkflowExecution): Promise<boolean>;
}

export default WorkflowExecutionGateway;
