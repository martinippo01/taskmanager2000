import { Workflow } from '@interfaces/types/Workflow.js';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain.js';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { CreateWorkflowRequestDto } from '@interfaces/types/CreateWorkflow';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import WorkflowAlreadyExistsException from '@exceptions/WorkflowAlreadyExistsException';
import InvalidWorkflowPlanException from '@exceptions/InvalidWorkflowPlanException';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';

@Injectable()
class WorkflowDomainImpl implements WorkflowDomain {
  private readonly LOGGER = new Logger(WorkflowDomainImpl.name);

  constructor(
    private readonly workflowDao: WorkflowDao,
    private readonly workflowPlanDomain: WorkflowPlanDomain,
  ) {}

  async createWorkflow(
    request: CreateWorkflowRequestDto,
  ): Promise<Workflow | null> {
    this.LOGGER.debug(`Creating workflow`);
    // Validate the plan format
    this.LOGGER.debug('Validating plan format');
    if (!this.workflowPlanDomain.isPlanFormatValid(request.plan)) {
      throw new InvalidWorkflowPlanException();
    }

    this.LOGGER.debug('Getting plan props');
    const { name, description, inputParams } =
      this.workflowPlanDomain.getPlanProps(request.plan);

    // Validate the workflow does not exist
    this.LOGGER.debug('Validating workflow does not exist');
    const wf = await this.workflowDao.getWorkflow(name);
    if (wf !== null) {
      throw new WorkflowAlreadyExistsException(name);
    }

    // Persist the new workflow
    this.LOGGER.debug('Persisting new workflow');
    const newWorkflow: Workflow = {
      version: 1,
      name: name,
      description,
      inputParams,
      plan: planPath,
    };
    await this.workflowDao.createWorkflow(newWorkflow);
    this.LOGGER.log(`Workflow ${name} created`);
    return newWorkflow;
  }

  async isWorkflowEnabled(name: string): Promise<boolean> {
    this.LOGGER.debug(`Checking if workflow ${name} is enabled`);
    const wfEntity = await this.workflowDao.getWorkflow(name);
    if (!wfEntity) {
      throw new WorkflowNotFoundException(name);
    }
    return wfEntity.enabled;
  }

  async toggleWorkflow(name: string): Promise<boolean> {
    this.LOGGER.debug(`Getting workflow ${name}`);
    const wfEntity = await this.workflowDao.getWorkflow(name);

    if (!wfEntity) {
      throw new WorkflowNotFoundException(name);
    }

    this.LOGGER.debug(`Toggling workflow ${name}`);
    const response = wfEntity.enabled
      ? await this.workflowDao.disableWorkflow(name)
      : await this.workflowDao.enableWorkflow(name);

    if (!response) {
      throw new InternalServerErrorException('Could not toggle workflow');
    }

    return !wfEntity.enabled;
  }

  async getWorkflow(name: string): Promise<Workflow | null> {
    this.LOGGER.debug(`Getting workflow ${name}`);
    return await this.workflowDao.getWorkflow(name);
  }
}

export default WorkflowDomainImpl;
