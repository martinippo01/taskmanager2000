import { Workflow } from '@interfaces/types/Workflow.js';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain.js';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import WorkflowAlreadyExistsException from '@exceptions/WorkflowAlreadyExistsException';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';

@Injectable()
class WorkflowDomainImpl implements WorkflowDomain {
  private readonly LOGGER = new Logger(WorkflowDomainImpl.name);

  constructor(
    @Inject(WorkflowDao) private readonly workflowDao: WorkflowDao,
    @Inject(WorkflowPlanDomain)
    private readonly workflowPlanDomain: WorkflowPlanDomain,
  ) {}

  async createWorkflow(fileContent: string): Promise<Workflow | null> {
    this.LOGGER.debug(`Creating workflow`);
    // Validate the plan format
    this.LOGGER.debug('Validating plan format');
    const wf_plan = await this.workflowPlanDomain.getPlanFromYaml(fileContent);

    this.LOGGER.debug('Getting plan props');
    const { name, description, inputParams, version } =
      await this.workflowPlanDomain.getPlanProperties(fileContent);

    // Validate the workflow does not exist
    this.LOGGER.debug('Validating workflow does not exist');
    if (await this.doesWorkflowExist(name, version)) {
      throw new WorkflowAlreadyExistsException(name);
    }

    // Persist the new workflow
    this.LOGGER.debug('Persisting new workflow');
    const wf: Workflow = {
      version,
      name: name,
      description,
      inputParams,
      plan: wf_plan,
      enabled: true,
    };

    await this.workflowDao.createWorkflow(wf);
    this.LOGGER.log(`Workflow ${name} created`);
    return wf;
  }

  private async doesWorkflowExist(
    name: string,
    version?: string,
  ): Promise<boolean> {
    this.LOGGER.debug(`Checking if workflow ${name} exists`);
    return (await this.workflowDao.getWorkflow(name, version)) !== null;
  }

  async isWorkflowEnabled(name: string, version?: string): Promise<boolean> {
    this.LOGGER.debug(`Checking if workflow ${name} is enabled`);
    const wfEntity = await this.workflowDao.getWorkflow(name, version);
    if (!wfEntity) {
      throw new WorkflowNotFoundException(name);
    }
    return wfEntity.enabled;
  }

  async toggleWorkflow(name: string, version?: string): Promise<boolean> {
    this.LOGGER.debug(`Getting workflow ${name}`);
    const wfEntity = await this.workflowDao.getWorkflow(name, version);

    if (!wfEntity) {
      throw new WorkflowNotFoundException(name);
    }

    this.LOGGER.debug(`Toggling workflow ${name}`);
    const response = wfEntity.enabled
      ? await this.workflowDao.disableWorkflow(name, version)
      : await this.workflowDao.enableWorkflow(name, version);

    if (!response) {
      throw new InternalServerErrorException('Could not toggle workflow');
    }

    return !wfEntity.enabled;
  }

  async getWorkflow(name: string, version?: string): Promise<Workflow | null> {
    this.LOGGER.debug(`Getting workflow ${name}`);
    return await this.workflowDao.getWorkflow(name, version);
  }
}

export default WorkflowDomainImpl;
