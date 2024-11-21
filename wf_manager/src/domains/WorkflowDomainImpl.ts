import { Workflow } from '@interfaces/types/Workflow.js';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain.js';
import { Injectable } from '@nestjs/common';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { CreateWorkflowRequestDto } from '@interfaces/types/CreateWorkflow';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import WorkflowAlreadyExistsException from '@exceptions/WorkflowAlreadyExistsException';
import InvalidWorkflowPlanException from '@exceptions/InvalidWorkflowPlanException';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import { WorkflowPlanDao } from '@interfaces/repositories/WorkflowPlanDao';

@Injectable()
class WorkflowDomainImpl implements WorkflowDomain {
  constructor(
    private workflowDao: WorkflowDao,
    private workflowPlanDao: WorkflowPlanDao,
    private readonly workflowPlanDomain: WorkflowPlanDomain,
  ) {}

  async createWorkflow(
    request: CreateWorkflowRequestDto,
  ): Promise<Workflow | null> {
    // Validate the plan format
    if (!this.workflowPlanDomain.isPlanFormatValid(request.plan)) {
      throw new InvalidWorkflowPlanException();
    }

    const { name, description, inputParams } =
      this.workflowPlanDomain.getPlanProps(request.plan);

    // Validate the workflow does not exist
    const wf = await this.workflowDao.getWorkflow(name);
    if (wf !== null) {
      throw new WorkflowAlreadyExistsException(name);
    }

    // Persist the plan
    const planPath = await this.workflowPlanDao.savePlan(request.plan);

    // Persist the new workflow
    const newWorkflow: Workflow = {
      version: 1,
      name,
      description,
      inputParams,
      plan: planPath,
    };
    await this.workflowDao.createWorkflow(newWorkflow);
    return newWorkflow;
  }

  // esto quizás no debería estar acá
  async doesWorkflowExist(name: string): Promise<boolean> {
    return (await this.workflowDao.getWorkflow(name)) !== null;
  }

  async isWorkflowEnabled(name: string): Promise<boolean> {
    const wfEntity = await this.workflowDao.getWorkflow(name);
    if (!wfEntity) {
      throw new WorkflowNotFoundException(name);
    }
    return wfEntity.enabled;
  }

  async toggleWorkflow(name: string): Promise<boolean> {
    const wfEntity = await this.workflowDao.getWorkflow(name);

    if (!wfEntity) {
      throw new WorkflowNotFoundException(name);
    }

    if (wfEntity.enabled) {
      await this.workflowDao.disableWorkflow(wfEntity.name);
    } else {
      await this.workflowDao.enableWorkflow(wfEntity.name);
    }

    return !wfEntity.enabled;
  }

  async getWorkflow(name: string): Promise<Workflow | null> {
    const wfEntity = await this.workflowDao.getWorkflow(name);

    if (!wfEntity) return null;

    return {
      version: wfEntity.version,
      name: wfEntity.name,
      description: wfEntity.description,
      inputParams: wfEntity.inputParams,
      plan: wfEntity.plan,
    };
  }
}

export default WorkflowDomainImpl;
