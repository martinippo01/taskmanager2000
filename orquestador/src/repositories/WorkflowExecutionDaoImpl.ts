// src/dao/workflow-execution.dao.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
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
import WorkflowExecutionNotFoundException from '@exceptions/WorkflowExecutionNotFoundException';
import CannotDeleteWorkflowExecutionException from '@exceptions/CannotDeleteWorkflowExecutionException';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
export class WorkflowExecutionDaoImpl implements WorkflowExecutionDao {
  private readonly LOGGER = new Logger(WorkflowExecutionDaoImpl.name);

  constructor(
    @InjectRepository(WorkflowExecution)
    private readonly workflowExecutionRepository: Repository<WorkflowExecution>,
    private readonly dataSource: DataSource,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async saveWorkflowExecution(
    data: Partial<WorkflowExecution>,
  ): Promise<WorkflowExecution> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.saveWorkflowExecution',
      async (span) => {
        if (!data.executionId) {
          span.addEvent('Execution ID not provided');
          throw new Error('Execution ID not provided');
        }
        span.setAttribute('workflow.execution.id', data.executionId);

        this.LOGGER.log(
          `Saving workflow execution with id ${data.executionId}`,
        );
        const existingWorkflow =
          await this.workflowExecutionRepository.findOneBy({
            executionId: data.executionId,
          });

        if (existingWorkflow) {
          span.addEvent('Workflow execution already exists');
          throw new RepeatedIdException(data.executionId || '');
        }

        const workflowExecution =
          await this.workflowExecutionRepository.create(data);
        return await this.workflowExecutionRepository.save(workflowExecution);
      },
    );
  }

  async updateStatus(
    executionId: string,
    newStatus: WfExecutionStatus,
  ): Promise<WorkflowExecution | null> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.updateStatus',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        span.setAttribute('workflow.execution.status', newStatus);
        return this.dataSource.transaction(async (manager) => {
          const workflowExecution = await manager
            .createQueryBuilder(WorkflowExecution, 'workflow')
            .setLock('pessimistic_write') // Lock the row
            .where('workflow.executionId = :executionId', { executionId })
            .andWhere('workflow.status <> :newStatus', { newStatus })
            .getOne();

          if (!workflowExecution) {
            span.addEvent('Workflow execution not found');
            this.LOGGER.log(
              `El workflow ${executionId} no existe o ya se encuentra en el estado ${newStatus}`,
            );
            return null;
          }

          this.LOGGER.log(
            `El workflow ${executionId} ha sido tomado por esta instancia`,
          );

          workflowExecution.status = newStatus;
          await manager.save(workflowExecution);
          span.setAttribute('workflow.execution.status', newStatus);

          return workflowExecution;
        });
      },
    );
  }

  async deleteWorkflow(executionId: string): Promise<boolean> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.deleteWorkflow',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);

        try {
          const result =
            await this.workflowExecutionRepository.delete(executionId);
          this.LOGGER.log(`Deleting workflow executionwith id ${executionId}`);
          span.setAttribute(
            'workflow.execution.deleted',
            result.affected !== 0,
          );
          return result.affected !== 0;
        } catch (error) {
          span.addEvent('Failed to delete workflow execution');
          throw new CannotDeleteWorkflowExecutionException(executionId, error);
        }
      },
    );
  }

  async getStepsFromExecution(executionId: string): Promise<stepsInfo | null> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.getStepsFromExecution',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);

        const workflowExecution =
          await this.workflowExecutionRepository.findOneBy({
            executionId,
          });

        span.setAttribute('workflow.execution.found', !!workflowExecution);
        if (!workflowExecution) {
          this.LOGGER.log(
            `Workflow execution with ID ${executionId} not found.`,
          );
          return null;
        }

        this.LOGGER.log(`Getting steps from ${executionId}`);

        return {
          steps: workflowExecution.plan.steps,
          lastRun: workflowExecution.lastStepRun,
          inputArguments: workflowExecution.inputArguments,
        };
      },
    );
  }

  async updateStep(executionId: string, wantedOutput: string, name: string) {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.updateStep',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        span.setAttribute('workflow.execution.lastStepRun.name', name);
        span.setAttribute(
          'workflow.execution.lastStepRun.output.path',
          wantedOutput,
        );
        const workflowExecution =
          await this.workflowExecutionRepository.findOneBy({
            executionId,
          });

        span.setAttribute('workflow.execution.found', !!workflowExecution);
        if (!workflowExecution) {
          span.addEvent('Workflow execution not found');
          throw new WorkflowExecutionNotFoundException(executionId);
        }

        if (
          name in workflowExecution.outputs &&
          workflowExecution.outputs[name]
        ) {
          return workflowExecution;
        }

        workflowExecution.outputs = {
          ...workflowExecution.outputs,
          [name]: wantedOutput,
        };
        workflowExecution.lastStepRun = name;

        return this.workflowExecutionRepository.save(workflowExecution);
      },
    );
  }

  async getStepResultPath(
    executionId: string,
    step: string,
  ): Promise<string | undefined> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.getStepResultPath',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        span.setAttribute('workflow.execution.step.name', step);
        const workflowExecution =
          await this.workflowExecutionRepository.findOneBy({
            executionId,
          });

        span.setAttribute('workflow.execution.found', !!workflowExecution);
        if (!workflowExecution) {
          span.addEvent('Workflow execution not found');
          throw new WorkflowExecutionNotFoundException(executionId);
        }

        return workflowExecution.outputs[step];
      },
    );
  }

  async getWorkflowExecutionById(
    executionId: string,
  ): Promise<WorkflowExecution | null> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.getWorkflowExecutionById',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);

        this.LOGGER.log(`Fetching workflow execution with id ${executionId}`);
        const workflowExecution =
          await this.workflowExecutionRepository.findOneBy({
            executionId,
          });

        span.setAttribute('workflow.execution.found', !!workflowExecution);
        if (!workflowExecution) {
          span.addEvent(`Workflow execution not found`);
          this.LOGGER.log(
            `Workflow execution with ID ${executionId} not found.`,
          );
          return null;
        }

        return workflowExecution;
      },
    );
  }

  async getExecutionIdsByName(workflowName: string): Promise<string[] | null> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.getExecutionIdsByName',
      async (span) => {
        span.setAttribute('workflow.name', workflowName);

        this.LOGGER.log(
          `Fetching execution IDs for workflow name ${workflowName}`,
        );
        const workflows = await this.workflowExecutionRepository.find({
          where: { name: workflowName },
          select: ['executionId'],
        });

        span.setAttribute('workflow.execution.length', workflows.length);
        if (workflows.length === 0) {
          this.LOGGER.log(`No workflows found with name ${workflowName}`);
          return null;
        }

        return workflows.map((workflow) => workflow.executionId);
      },
    );
  }

  async getAllExecutionIds(): Promise<string[]> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.getAllExecutionIds',
      async (span) => {
        this.LOGGER.log('Fetching all workflow execution IDs');
        const executions = await this.workflowExecutionRepository.find({
          select: ['executionId'],
        });
        span.setAttribute('workflow.execution.length', executions.length);
        return executions.map((execution) => execution.executionId);
      },
    );
  }

  async markExecutionAsError(
    executionId: string,
    reason: string,
  ): Promise<WorkflowExecution> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDaoImpl.markExecutionAsError',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        span.setAttribute('workflow.execution.error.reason', reason);
        const workflowExecution =
          await this.workflowExecutionRepository.findOneBy({
            executionId,
          });

        span.setAttribute('workflow.execution.found', !!workflowExecution);
        if (!workflowExecution) {
          span.addEvent('Workflow execution not found');
          throw new WorkflowExecutionNotFoundException(executionId);
        }

        workflowExecution.status = WfExecutionStatus.ERROR;
        workflowExecution.errorReason = reason;

        return this.workflowExecutionRepository.save(workflowExecution);
      },
    );
  }
}
