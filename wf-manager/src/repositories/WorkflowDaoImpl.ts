import { Workflow, WorkflowMetadata } from '@interfaces/types/Workflow';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import { Plan } from '@shared/WorkflowPlan';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import { TracerGateway } from '@shared/TracerGateway';

const workflowPlanKey: (name: string, version: string) => string = (
  name: string,
  version: string,
) => `${name.toUpperCase()}:${version.toUpperCase()}:PLAN`;

const workflowMetadataKey: (name: string, version: string) => string = (
  name: string,
  version: string,
) => `${name.toUpperCase()}:${version.toUpperCase()}:METADATA`;

const workflowLatestKey: (name: string) => string = (name: string) =>
  `${name.toUpperCase()}:LATEST`;

const workflowsKey: string = 'WORKFLOWS';

const workflowVersionsKey: (name: string) => string = (name: string) =>
  `WORKFLOW:${name.toUpperCase()}:VERSIONS`;

@Injectable()
class WorkflowDaoImpl implements WorkflowDao {
  private readonly LOGGER = new Logger(WorkflowDaoImpl.name);

  constructor(
    @Inject(RedisRepository) private readonly redisRepository: RedisRepository,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  private async doesWorkflowVersionExist(
    name: string,
    version: string,
  ): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.doesWorkflowVersionExist',
      async (span) => {
        span.setAttribute('workflow.name', name);
        span.setAttribute('workflow.version', version);
        this.LOGGER.debug(
          `Checking if workflow ${name} version ${version} exists`,
        );
        const exists = await this.redisRepository.sIsMember(
          workflowVersionsKey(name),
          version,
        );
        this.LOGGER.debug(
          `Workflow ${name} version ${version} exists: ${exists}`,
        );
        span.setAttribute('workflow.exists', exists);
        return exists;
      },
    );
  }

  async getWorkflowMetadata(
    name: string,
    version: string,
  ): Promise<WorkflowMetadata | null> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.getWorkflowMetadata',
      async (span) => {
        span.setAttribute('workflow.name', name);
        span.setAttribute('workflow.version', version);
        this.LOGGER.debug(
          `Fetching workflow metadata for ${name} version ${version}`,
        );
        if (version === 'latest' || version === null || version === undefined) {
          version = await this.getLatestVersion(name);
        }
        const res = await this.redisRepository.get(
          workflowMetadataKey(name, version),
        );
        this.LOGGER.debug(
          `Fetched workflow metadata for ${name} version ${version}`,
        );
        span.setAttribute('workflow.metadata.found', res !== null);
        return res ? JSON.parse(res) : null;
      },
    );
  }

  async getWorkflowPlan(name: string, version: string): Promise<Plan | null> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.getWorkflowPlan',
      async (span) => {
        span.setAttribute('workflow.name', name);
        span.setAttribute('workflow.version', version);
        this.LOGGER.debug(
          `Fetching workflow plan for ${name} version ${version}`,
        );
        if (version === 'latest' || version === null || version === undefined) {
          version = await this.getLatestVersion(name);
        }
        const res = await this.redisRepository.get(
          workflowPlanKey(name, version),
        );
        this.LOGGER.debug(
          `Fetched workflow plan for ${name} version ${version}`,
        );
        span.setAttribute('workflow.plan.found', res !== null);
        return res ? JSON.parse(res) : null;
      },
    );
  }

  async getWorkflow(name: string, version: string): Promise<Workflow | null> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.getWorkflow',
      async (span) => {
        span.setAttribute('workflow.name', name);
        span.setAttribute('workflow.version', version);
        this.LOGGER.debug(`Fetching workflow for ${name} version ${version}`);
        if (version === 'latest' || version === null || version === undefined) {
          version = await this.getLatestVersion(name);
        }
        const resPlan = await this.getWorkflowPlan(name, version);
        span.setAttribute('workflow.plan.found', resPlan !== null);
        const resMetadata = await this.getWorkflowMetadata(name, version);
        span.setAttribute('workflow.metadata.found', resMetadata !== null);
        if (!resPlan || !resMetadata) {
          this.LOGGER.warn(`Workflow not found for ${name} version ${version}`);
          return null;
        }
        this.LOGGER.debug(`Fetched workflow for ${name} version ${version}`);
        return { ...resMetadata, plan: resPlan };
      },
    );
  }

  async createWorkflow(workflow: Workflow): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.createWorkflow',
      async (span) => {
        span.setAttribute('workflow.name', workflow.name);
        span.setAttribute('workflow.version', workflow.version);
        this.LOGGER.debug(
          `Creating workflow for ${workflow.name} version ${workflow.version}`,
        );
        const { plan, ...workflowMetadata } = workflow;

        try {
          await this.redisRepository.multi([
            ['set', workflowLatestKey(workflow.name), workflow.version],
            [
              'set',
              workflowPlanKey(workflow.name, workflow.version),
              JSON.stringify(plan),
            ],
            [
              'set',
              workflowMetadataKey(workflow.name, workflow.version),
              JSON.stringify(workflowMetadata),
            ],
            ['sadd', workflowsKey, workflow.name],
            ['sadd', workflowVersionsKey(workflow.name), workflow.version],
          ]);
        } catch (e) {
          this.LOGGER.error(`Error creating workflow: ${e}`);
          return false;
        }
        span.setAttribute('workflow.created', true);
        this.LOGGER.log(
          `Created workflow for ${workflow.name} version ${workflow.version}`,
        );
        return true;
      },
    );
  }

  async disableWorkflow(name: string, version: string): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.disableWorkflow',
      async (span) => {
        span.setAttribute('workflow.name', name);
        span.setAttribute('workflow.version', version);
        this.LOGGER.debug(`Disabling workflow for ${name} version ${version}`);
        if (version === 'latest' || version === null || version === undefined) {
          version = await this.getLatestVersion(name);
        }
        const resMetadata = await this.getWorkflowMetadata(name, version);
        span.setAttribute('workflow.metadata.found', resMetadata !== null);
        if (!resMetadata) {
          this.LOGGER.error(
            `Workflow not found for ${name} version ${version}`,
          );
          throw new WorkflowNotFoundException(name);
        }
        resMetadata.enabled = false;
        await this.redisRepository.set(
          workflowMetadataKey(name, version),
          JSON.stringify(resMetadata),
        );
        this.LOGGER.log(`Disabled workflow for ${name} version ${version}`);
        span.setAttribute('workflow.disabled', true);
        return true;
      },
    );
  }

  async enableWorkflow(name: string, version: string): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.enableWorkflow',
      async (span) => {
        span.setAttribute('workflow.name', name);
        span.setAttribute('workflow.version', version);
        this.LOGGER.debug(`Enabling workflow for ${name} version ${version}`);
        if (version === 'latest' || version === null || version === undefined) {
          version = await this.getLatestVersion(name);
        }
        const resMetadata = await this.getWorkflowMetadata(name, version);
        span.setAttribute('workflow.metadata.found', resMetadata !== null);
        if (!resMetadata) {
          this.LOGGER.error(
            `Workflow not found for ${name} version ${version}`,
          );
          throw new WorkflowNotFoundException(name);
        }
        resMetadata.enabled = true;
        await this.redisRepository.set(
          workflowMetadataKey(name, version),
          JSON.stringify(resMetadata),
        );
        this.LOGGER.log(`Enabled workflow for ${name} version ${version}`);
        span.setAttribute('workflow.enabled', true);
        return true;
      },
    );
  }

  async getLatestVersion(name: string): Promise<string> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.getLatestVersion',
      async (span) => {
        span.setAttribute('workflow.name', name);
        this.LOGGER.debug(`Fetching latest version for ${name}`);
        const res = await this.redisRepository.get(workflowLatestKey(name));
        span.setAttribute('workflow.version.found', res !== null);
        if (!res) {
          this.LOGGER.error(`Workflow not found for ${name}`);
          throw new WorkflowNotFoundException(name);
        }
        span.setAttribute('workflow.version', res);
        this.LOGGER.debug(`Fetched latest version for ${name}`);
        return res;
      },
    );
  }

  async doesWorkflowExist(name: string, version?: string): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowDaoImpl.doesWorkflowExist',
      async (span) => {
        span.setAttribute('workflow.name', name);
        if (version) span.setAttribute('workflow.version', version);
        this.LOGGER.debug(`Checking if workflow ${name} exists`);
        const res = await this.redisRepository.sIsMember(workflowsKey, name);
        this.LOGGER.debug(`Workflow ${name} exists: ${res}`);
        span.setAttribute('workflow.exists', res !== null);
        if (!res) {
          return false;
        }
        if (version === 'latest' || version === null || version === undefined) {
          span.setAttribute('workflow.version.latest', true);
          return true;
        }
        const workflowVersionExists = await this.doesWorkflowVersionExist(
          name,
          version,
        );
        span.setAttribute('workflow.version.exists', workflowVersionExists);
        return workflowVersionExists;
      },
    );
  }
}

export default WorkflowDaoImpl;
