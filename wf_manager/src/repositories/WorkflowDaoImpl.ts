import { Workflow, WorkflowMetadata } from '@interfaces/types/Workflow';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import { Plan } from 'shared/lib/WorkflowPlan';

@Injectable()
class WorkflowDaoImpl implements WorkflowDao {
  private readonly LOGGER = new Logger(WorkflowDaoImpl.name);

  constructor(private readonly redisRepository: RedisRepository) {}
  getWorkflowMetadata(name: string): Promise<WorkflowMetadata | null> {
    throw new Error('Method not implemented.');
  }
  getWorkflowPlan(name: string): Promise<Plan | null> {
    throw new Error('Method not implemented.');
  }

  async getWorkflow(name: string): Promise<Workflow | null> {
    this.redisRepository.get('workflow', name);
    throw new Error('Method not implemented.');
  }

  createWorkflow(workflow: Workflow): Promise<boolean> {
    this.redisRepository.set(
      'workflow',
      workflow.name,
      JSON.stringify(workflow),
    );
    throw new Error('Method not implemented.');
  }

  disableWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  enableWorkflow(name: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowDaoImpl;
