import { Workflow, WorkflowEntity } from '@interfaces/types/Workflow';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { Injectable } from '@nestjs/common';

@Injectable()
class WorkflowDaoImpl implements WorkflowDao {
  async getWorkflow(name: string): Promise<WorkflowEntity | null> {
    throw new Error('Method not implemented.');
  }

  async getWorkflowById(id: number): Promise<WorkflowEntity | null> {
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
