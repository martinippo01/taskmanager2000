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

  constructor(private readonly redisRepository: RedisRepository) {}

  async getWorkflowMetadata(
    name: string,
    version: string,
  ): Promise<WorkflowMetadata | null> {
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    let res = await this.redisRepository.get(
      workflowMetadataKey(name, version),
    );
    return JSON.parse(res);
  }

  async getWorkflowPlan(name: string, version: string): Promise<Plan | null> {
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    let res = await this.redisRepository.get(workflowPlanKey(name, version));
    return JSON.parse(res);
  }

  async getWorkflow(name: string, version: string): Promise<Workflow | null> {
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const resPlan = await this.getWorkflowPlan(name, version);
    const resMetadata = await this.getWorkflowMetadata(name, version);
    if (!resPlan || !resMetadata) {
      return null;
    }
    return { ...resMetadata, plan: resPlan };
  }

  async createWorkflow(workflow: Workflow): Promise<boolean> {
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
    throw new Error('Method not implemented.');
  }

  async disableWorkflow(name: string, version: string): Promise<boolean> {
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const resMetadata = await this.getWorkflowMetadata(name, version);
    if (!resMetadata) {
      throw new Error('Workflow not found');
    }
    resMetadata.enabled = false;
    this.redisRepository.set(
      workflowMetadataKey(name, version),
      JSON.stringify(resMetadata),
    );
    throw new Error('Method not implemented.');
  }

  async enableWorkflow(name: string, version: string): Promise<boolean> {
    if (version === 'latest' || version === null || version === undefined) {
      version = await this.getLatestVersion(name);
    }
    const resMetadata = await this.getWorkflowMetadata(name, version);
    if (!resMetadata) {
      throw new Error('Workflow not found');
    }
    resMetadata.enabled = true;
    this.redisRepository.set(
      workflowMetadataKey(name, version),
      JSON.stringify(resMetadata),
    );
    throw new Error('Method not implemented.');
  }

  async getLatestVersion(name: string): Promise<string | null> {
    return this.redisRepository.get(workflowLatestKey(name));
  }
}

export default WorkflowDaoImpl;
