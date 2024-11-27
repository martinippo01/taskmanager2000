import { Workflow } from '@interfaces/types/Workflow.js';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain.js';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { CreateWorkflowRequestDto } from '@interfaces/types/CreateWorkflow';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import WorkflowAlreadyExistsException from '@exceptions/WorkflowAlreadyExistsException';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';

@Injectable()
class WorkflowDomainImpl implements WorkflowDomain {
  constructor(
    private readonly workflowDao: WorkflowDao,
    private readonly workflowPlanDomain: WorkflowPlanDomain,
  ) {}

  async createWorkflow(
    request: CreateWorkflowRequestDto,
  ): Promise<Workflow | null> {
    // Validate the plan format
    const wf_plan = await this.workflowPlanDomain.getPlanFromYaml(request.plan);

    const { name, description, inputParams, version } =
      await this.workflowPlanDomain.getPlanProperties(request.plan);

    // Validate the workflow does not exist
    if (await this.doesWorkflowExist(name, version)) {
      throw new WorkflowAlreadyExistsException(name);
    }

    const wf = {
      version: version,
      name: name,
      description,
      inputParams,
      plan: wf_plan,
      enabled: true,
    };

    await this.workflowDao.createWorkflow(wf);
    return wf;
  }

  // esto quizás no debería estar acá
  private async doesWorkflowExist(
    name: string,
    version: string,
  ): Promise<boolean> {
    return (await this.workflowDao.getWorkflow(name, version)) !== null;
  }

  async isWorkflowEnabled(name: string, version: string): Promise<boolean> {
    const wfEntity = await this.workflowDao.getWorkflow(name, version);
    if (!wfEntity) {
      throw new WorkflowNotFoundException(name);
    }
    return wfEntity.enabled;
  }

  async toggleWorkflow(name: string, version: string): Promise<boolean> {
    const wfEntity = await this.workflowDao.getWorkflow(name, version);

    if (!wfEntity) {
      throw new WorkflowNotFoundException(name);
    }

    const response = wfEntity.enabled
      ? await this.workflowDao.disableWorkflow(name, version)
      : await this.workflowDao.enableWorkflow(name, version);

    if (!response) {
      throw new InternalServerErrorException('Could not toggle workflow');
    }

    return !wfEntity.enabled;
  }

  async getWorkflow(name: string, version: string): Promise<Workflow | null> {
    const wfEntity = await this.workflowDao.getWorkflow(name, version);

    if (!wfEntity) return null;

    return {
      version: wfEntity.version,
      name: wfEntity.name,
      description: wfEntity.description,
      inputParams: wfEntity.inputParams,
      plan: wfEntity.plan,
      enabled: wfEntity.enabled,
    };
  }
}

export default WorkflowDomainImpl;
