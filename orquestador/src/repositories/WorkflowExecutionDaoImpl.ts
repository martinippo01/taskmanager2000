// src/dao/workflow-execution.dao.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  WfExecutionStatus,
  WorkflowExecution,
} from '@entities/worflow-execution.entity';
import {
  stepsInfo,
  WorkflowExecutionDao,
} from '@interfaces/repository/WorkflowExecutionDao';
import { RepeatedIdException } from '@exceptions/RepeatedIdException';

@Injectable()
export class WorkflowExecutionDaoImpl implements WorkflowExecutionDao {
  private readonly LOGGER = new Logger(WorkflowExecutionDaoImpl.name);

  constructor(
    @InjectRepository(WorkflowExecution)
    private readonly workflowExecutionRepository: Repository<WorkflowExecution>,
    private readonly dataSource: DataSource,
  ) {}

  async saveWorkflowExecution(
    data: Partial<WorkflowExecution>,
  ): Promise<WorkflowExecution> {
    this.LOGGER.log(`Saving workflow execution with id ${data.executionId}`);
    const existingWorkflow = await this.workflowExecutionRepository.findOneBy({
      executionId: data.executionId,
    });

    if (existingWorkflow) {
      throw new RepeatedIdException(data.executionId || '');
    }

    const workflowExecution = this.workflowExecutionRepository.create(data);
    return this.workflowExecutionRepository.save(workflowExecution);
  }

  async updateStatus(
    executionId: string,
    newStatus: WfExecutionStatus,
  ): Promise<WorkflowExecution | null> {
    return this.dataSource.transaction(async (manager) => {
      const workflowExecution = await manager
        .createQueryBuilder(WorkflowExecution, 'workflow')
        .setLock('pessimistic_write') // Lock the row
        .where('workflow.executionId = :executionId', { executionId })
        .andWhere('workflow.status <> :newStatus', { newStatus })
        .getOne();

      if (!workflowExecution) {
        this.LOGGER.log(
          `El workflow ${executionId} no existe o ya se encuentra en el estado ${newStatus}`,
        );
        return null;
      }

      this.LOGGER.log(
        'El workflow ${executionId} ha sido tomado por esta instancia',
      );

      workflowExecution.status = newStatus;
      await manager.save(workflowExecution);

      return workflowExecution;
    });
  }

  async deleteWorkflow(executionId: string): Promise<boolean> {
    try {
      const result = await this.workflowExecutionRepository.delete(executionId);
      this.LOGGER.log(`Deleting workflow executionwith id ${executionId}`);
      return result.affected !== 0;
    } catch (error) {
      this.LOGGER.error(
        `Failed to delete workflow with ID ${executionId}:`,
        error,
      );
      throw new Error('Unable to delete workflow');
    }
  }

  async getStepsFromExecution(executionId: string): Promise<stepsInfo | null> {
    const workflowExecution = await this.workflowExecutionRepository.findOneBy({
      executionId,
    });

    if (!workflowExecution) {
      this.LOGGER.log(`Workflow execution with ID ${executionId} not found.`);
      return null;
    }

    this.LOGGER.log(`Getting steps from ${executionId}`);

    return {
      steps: workflowExecution.plan.steps,
      lastRun: workflowExecution.lastStepRun,
      inputArguments: workflowExecution.inputArguments,
    };
  }

  async updateStep(
    executionId: string,
    lastStepRun: string,
    wantedOutput: string,
  ) {
    const workflowExecution = await this.workflowExecutionRepository.findOneBy({
      executionId,
    });

    if (!workflowExecution) {
      throw new Error(`Workflow execution with ID ${executionId} not found.`);
    }

    workflowExecution.outputs = {
      ...workflowExecution.outputs,
      [lastStepRun]: wantedOutput,
    };
    workflowExecution.lastStepRun = lastStepRun;

    return this.workflowExecutionRepository.save(workflowExecution);
  }

  async getStepResultPath(executionId: string, step: string): Promise<string> {
    const workflowExecution = await this.workflowExecutionRepository.findOneBy({
      executionId,
    });

    if (!workflowExecution)
      throw new Error(`Workflow execution with ID ${executionId} not found.`);

    return workflowExecution.outputs[step];
  }

  async getWorkflowExecutionById(
    executionId: string,
  ): Promise<WorkflowExecution | null> {
    this.LOGGER.log(`Fetching workflow execution with id ${executionId}`);
    const workflowExecution = await this.workflowExecutionRepository.findOneBy({
      executionId,
    });

    if (!workflowExecution) {
      this.LOGGER.log(`Workflow execution with ID ${executionId} not found.`);
      return null;
    }

    return workflowExecution;
  }

  async getExecutionIdsByName(workflowName: string): Promise<string[] | null> {
    this.LOGGER.log(`Fetching execution IDs for workflow name ${workflowName}`);
    const workflows = await this.workflowExecutionRepository.find({
      where: { name: workflowName },
      select: ['executionId'],
    });

    if (workflows.length === 0) {
      this.LOGGER.log(`No workflows found with name ${workflowName}`);
      return null;
    }

    return workflows.map((workflow) => workflow.executionId);
  }

  async getAllExecutionIds(): Promise<string[]> {
    this.LOGGER.log('Fetching all workflow execution IDs');
    const executions = await this.workflowExecutionRepository.find({
      select: ['executionId'],
    });
    return executions.map((execution) => execution.executionId);
  }

  async markExecutionAsError(
    executionId: string,
    reason: string,
  ): Promise<WorkflowExecution> {
    const workflowExecution = await this.workflowExecutionRepository.findOneBy({
      executionId,
    });

    if (!workflowExecution) {
      throw new Error(`Workflow execution with ID ${executionId} not found.`);
    }

    workflowExecution.status = WfExecutionStatus.ERROR;
    workflowExecution.errorReason = reason;

    return this.workflowExecutionRepository.save(workflowExecution);
  }
}
