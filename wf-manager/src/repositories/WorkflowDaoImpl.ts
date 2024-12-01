import { Workflow, WorkflowMetadata } from '@interfaces/types/Workflow';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import { Plan } from '@shared/WorkflowPlan';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';

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
  ) {}

  private async doesWorkflowVersionExist(
    name: string,
    version: string,
  ): Promise<boolean> {
    this.LOGGER.debug(`Checking if workflow ${name} version ${version} exists`);
    const res = await this.redisRepository.sIsMember(
      workflowVersionsKey(name),
      version,
    );
    this.LOGGER.debug(
      `Workflow ${name} version ${version} exists: ${res !== null}`,
    );
    return res !== null;
  }

  async getWorkflowMetadata(
    name: string,
    version: string,
  ): Promise<WorkflowMetadata | null> {
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
    return res ? JSON.parse(res) : null;
  }

  async getWorkflowPlan(name: string, version: string): Promise<Plan | null> {
    this.LOGGER.debug(`Fetching workflow plan for ${name} version ${version}`);
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const res = await this.redisRepository.get(workflowPlanKey(name, version));
    this.LOGGER.debug(`Fetched workflow plan for ${name} version ${version}`);
    return res ? JSON.parse(res) : null;
  }

  async getWorkflow(name: string, version: string): Promise<Workflow | null> {
    this.LOGGER.debug(`Fetching workflow for ${name} version ${version}`);
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const resPlan = await this.getWorkflowPlan(name, version);
    const resMetadata = await this.getWorkflowMetadata(name, version);
    if (!resPlan || !resMetadata) {
      this.LOGGER.warn(`Workflow not found for ${name} version ${version}`);
      return null;
    }
    this.LOGGER.debug(`Fetched workflow for ${name} version ${version}`);
    return { ...resMetadata, plan: resPlan };
  }

  async createWorkflow(workflow: Workflow): Promise<boolean> {
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
    this.LOGGER.log(
      `Created workflow for ${workflow.name} version ${workflow.version}`,
    );
    return true;
  }

  async disableWorkflow(name: string, version: string): Promise<boolean> {
    this.LOGGER.debug(`Disabling workflow for ${name} version ${version}`);
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const resMetadata = await this.getWorkflowMetadata(name, version);
    if (!resMetadata) {
      this.LOGGER.error(`Workflow not found for ${name} version ${version}`);
      throw new WorkflowNotFoundException(name);
    }
    resMetadata.enabled = false;
    this.redisRepository.set(
      workflowMetadataKey(name, version),
      JSON.stringify(resMetadata),
    );
    this.LOGGER.log(`Disabled workflow for ${name} version ${version}`);
    return true;
  }

  async enableWorkflow(name: string, version: string): Promise<boolean> {
    this.LOGGER.debug(`Enabling workflow for ${name} version ${version}`);
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const resMetadata = await this.getWorkflowMetadata(name, version);
    if (!resMetadata) {
      this.LOGGER.error(`Workflow not found for ${name} version ${version}`);
      throw new WorkflowNotFoundException(name);
    }
    resMetadata.enabled = true;
    this.redisRepository.set(
      workflowMetadataKey(name, version),
      JSON.stringify(resMetadata),
    );
    this.LOGGER.log(`Enabled workflow for ${name} version ${version}`);
    return true;
  }

  async getLatestVersion(name: string): Promise<string> {
    this.LOGGER.debug(`Fetching latest version for ${name}`);
    const res = await this.redisRepository.get(workflowLatestKey(name));
    if (!res) {
      this.LOGGER.error(`Workflow not found for ${name}`);
      throw new WorkflowNotFoundException(name);
    }
    this.LOGGER.debug(`Fetched latest version for ${name}`);
    return res;
  }

  async doesWorkflowExist(name: string, version?: string): Promise<boolean> {
    this.LOGGER.debug(`Checking if workflow ${name} exists`);
    const res = await this.redisRepository.sIsMember(workflowsKey, name);
    this.LOGGER.debug(`Workflow ${name} exists: ${res}`);
    if (!res) {
      return false;
    }
    if (version === 'latest' || version === null || version === undefined) {
      return true;
    }
    const workflowVersionExists = await this.doesWorkflowVersionExist(
      name,
      version,
    );
    return workflowVersionExists !== null;
  }
}

export default WorkflowDaoImpl;
