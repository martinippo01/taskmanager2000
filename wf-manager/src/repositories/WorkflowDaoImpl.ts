import { Workflow, WorkflowMetadata } from '@interfaces/types/Workflow';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import { Plan } from 'shared/lib/WorkflowPlan';

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

@Injectable()
class WorkflowDaoImpl implements WorkflowDao {
  private readonly LOGGER = new Logger(WorkflowDaoImpl.name);

  constructor(
    @Inject(RedisRepository) private readonly redisRepository: RedisRepository,
  ) {}

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
    let res = await this.redisRepository.get(
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
    let res = await this.redisRepository.get(workflowPlanKey(name, version));
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
    // TODO: consider using a MULTI here!!
    this.redisRepository.set(
      workflowLatestKey(workflow.name),
      workflow.version,
    );

    const { plan, ...workflowMetadata } = workflow;

    this.redisRepository.set(
      workflowPlanKey(workflow.name, workflow.version),
      JSON.stringify(plan),
    );
    this.redisRepository.set(
      workflowMetadataKey(workflow.name, workflow.version),
      JSON.stringify(workflowMetadata),
    );
    this.LOGGER.log(
      `Created workflow for ${workflow.name} version ${workflow.version}`,
    );
    throw new Error('Method not implemented.');
  }

  async disableWorkflow(name: string, version: string): Promise<boolean> {
    this.LOGGER.debug(`Disabling workflow for ${name} version ${version}`);
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const resMetadata = await this.getWorkflowMetadata(name, version);
    if (!resMetadata) {
      this.LOGGER.error(`Workflow not found for ${name} version ${version}`);
      throw new Error('Workflow not found');
    }
    resMetadata.enabled = false;
    this.redisRepository.set(
      workflowMetadataKey(name, version),
      JSON.stringify(resMetadata),
    );
    this.LOGGER.log(`Disabled workflow for ${name} version ${version}`);
    throw new Error('Method not implemented.');
  }

  async enableWorkflow(name: string, version: string): Promise<boolean> {
    this.LOGGER.debug(`Enabling workflow for ${name} version ${version}`);
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const resMetadata = await this.getWorkflowMetadata(name, version);
    if (!resMetadata) {
      this.LOGGER.error(`Workflow not found for ${name} version ${version}`);
      throw new Error('Workflow not found');
    }
    resMetadata.enabled = true;
    this.redisRepository.set(
      workflowMetadataKey(name, version),
      JSON.stringify(resMetadata),
    );
    this.LOGGER.log(`Enabled workflow for ${name} version ${version}`);
    throw new Error('Method not implemented.');
  }

  async getLatestVersion(name: string): Promise<string> {
    this.LOGGER.debug(`Fetching latest version for ${name}`);
    const res = await this.redisRepository.get(workflowLatestKey(name));
    if (!res) {
      this.LOGGER.error(`Workflow not found for ${name}`);
      throw new Error('Workflow not found');
    }
    this.LOGGER.debug(`Fetched latest version for ${name}`);
    return res;
  }
}

export default WorkflowDaoImpl;
