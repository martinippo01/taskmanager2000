import { Workflow } from '@interfaces/types/Workflow.js';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain.js';
import { Injectable } from '@nestjs/common';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { WorkflowCreation } from '@interfaces/types/CreateWorkflow';

@Injectable()
class WorkflowDomainImpl implements WorkflowDomain {
  constructor(private workflowDao: WorkflowDao) {}

  createWorkflow(request: WorkflowCreation): Promise<Workflow | null> {
    throw new Error('Method not implemented.');
  }

  doesWorkflowExist(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  isWorkflowEnabled(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  toggleWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  getWorkflow(name: string): Promise<Workflow | null> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowDomainImpl;
