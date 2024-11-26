import { Workflow, WorkflowEntity } from '@interfaces/types/Workflow';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { Inject, Injectable } from '@nestjs/common';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';

@Injectable()
class WorkflowDaoImpl implements WorkflowDao {
  constructor(
    @Inject(RedisRepository) private readonly redisRepository: RedisRepository,
  ) {}

  async getWorkflow(name: string): Promise<WorkflowEntity | null> {
    this.redisRepository.get('workflow', name);
    throw new Error('Method not implemented.');
  }

  async getWorkflowById(id: number): Promise<WorkflowEntity | null> {
    throw new Error('Method not implemented.');
  }

  createWorkflow(workflow: Workflow): Promise<WorkflowEntity> {
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
