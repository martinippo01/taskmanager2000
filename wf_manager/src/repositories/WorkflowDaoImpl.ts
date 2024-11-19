import { Workflow, WorkflowEntity } from '@interfaces/Workflow.js';
import WorkflowDao from '@interfaces/WorkflowDao.js';

class WorkflowDaoImpl implements WorkflowDao {
  getWorkflow(name: string): Promise<WorkflowEntity | null> {
    throw new Error('Method not implemented.');
  }

  getWorkflowById(id: number): Promise<WorkflowEntity | null> {
    throw new Error('Method not implemented.');
  }

  createWorkflow(workflow: Workflow): Promise<WorkflowEntity> {
    throw new Error('Method not implemented.');
  }

  disableWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  enableWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowDaoImpl;
