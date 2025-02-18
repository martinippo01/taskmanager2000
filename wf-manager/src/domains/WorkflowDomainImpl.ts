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
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
class WorkflowDomainImpl implements WorkflowDomain {
  private readonly LOGGER = new Logger(WorkflowDomainImpl.name);

  constructor(
    @Inject(WorkflowDao) private readonly workflowDao: WorkflowDao,
    @Inject(WorkflowPlanDomain)
    private readonly workflowPlanDomain: WorkflowPlanDomain,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async createWorkflow(fileContent: string): Promise<Workflow | null> {
    return this.tracerGateway.trace(
      'WorkflowDomainImpl.createWorkflow',
      async (span) => {
        this.LOGGER.debug(`Creating workflow`);
        // Validate the plan format
        this.LOGGER.debug('Validating plan format');
        const wf_plan =
          await this.workflowPlanDomain.getPlanFromYaml(fileContent);

        this.LOGGER.debug('Getting plan props');
        const { name, description, inputParams, version } =
          await this.workflowPlanDomain.getPlanProperties(fileContent);

        // Validate the workflow does not exist
        this.LOGGER.debug('Validating workflow does not exist');
        const exists = await this.doesWorkflowExist(name, version);
        span.setAttribute('workflow.exists', exists);
        if (exists) {
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
        span.setAttribute('workflow.created', true);
        span.setAttribute('workflow.name', name);
        span.setAttribute('workflow.version', version);
        return wf;
      },
    );
  }

  private async doesWorkflowExist(
    name: string,
    version?: string,
  ): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowDomainImpl.doesWorkflowExist',
      async (span) => {
        this.LOGGER.debug(`Checking if workflow ${name} exists`);
        const exists = await this.workflowDao.doesWorkflowExist(name, version);
        span.setAttribute('workflow.exists', exists);
        return exists;
      },
    );
  }

  async isWorkflowEnabled(name: string, version?: string): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowDomainImpl.isWorkflowEnabled',
      async (span) => {
        this.LOGGER.debug(`Checking if workflow ${name} is enabled`);
        const wfEntity = await this.workflowDao.getWorkflow(name, version);
        span.setAttribute('workflow.exists', !!wfEntity);
        if (!wfEntity) {
          throw new WorkflowNotFoundException(name);
        }
        span.setAttribute('workflow.enabled', wfEntity.enabled);
        return wfEntity.enabled;
      },
    );
  }

  async toggleWorkflow(name: string, version?: string): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowDomainImpl.toggleWorkflow',
      async (span) => {
        this.LOGGER.debug(`Getting workflow ${name}`);
        const wfEntity = await this.workflowDao.getWorkflow(name, version);
        span.setAttribute('workflow.exists', !!wfEntity);
        if (!wfEntity) {
          throw new WorkflowNotFoundException(name);
        }

        this.LOGGER.debug(`Toggling workflow ${name}`);
        const response = wfEntity.enabled
          ? await this.workflowDao.disableWorkflow(name, version)
          : await this.workflowDao.enableWorkflow(name, version);

        span.setAttribute('workflow.toggled', response);
        if (!response) {
          throw new InternalServerErrorException('Could not toggle workflow');
        }
        span.setAttribute('workflow.enabled', !wfEntity.enabled);
        return !wfEntity.enabled;
      },
    );
  }

  async getWorkflow(name: string, version?: string): Promise<Workflow | null> {
    this.LOGGER.debug(`Getting workflow ${name}`);
    return await this.workflowDao.getWorkflow(name, version);
  }
}

export default WorkflowDomainImpl;
