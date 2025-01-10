import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';
import { WorkflowExecutionDao } from '@interfaces/repository/WorkflowExecutionDao';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WfExecutionStatus } from '@repositories/entities/worflow-execution.entity';
import { WorkflowExecutionRequest } from '@shared/WorkflowExecutionRequest';

@Injectable()
export class WorkflowExecutionDomainImpl implements WorkflowExecutionDomain {
  private readonly LOGGER = new Logger(WorkflowExecutionDomainImpl.name);

  constructor(
    @Inject(WorkflowExecutionDao)
    private readonly workflowExecutionRepository: WorkflowExecutionDao,
  ) {}

  async runNewWorkflowExecution(
    request: WorkflowExecutionRequest,
  ): Promise<{ alreadyRun: boolean; couldRun: boolean }> {
    try {
      // No me acuerdo por qué no ponemos TAKEN directamente al persistirlo
      await this.workflowExecutionRepository.saveWorkflowExecution({
        ...request,
      });
    } catch (e) {
      this.LOGGER.log(e.messages);
      return { alreadyRun: true, couldRun: false };
    }

    await this.tryToRunFirstStep(request.executionId);

    return { alreadyRun: false, couldRun: true };
  }

  async tryToRunFirstStep(executionId: string) {
    // quizás esto se hace directamente en el StepDomain
    await this.workflowExecutionRepository.updateStatus(
      executionId,
      WfExecutionStatus.TAKEN,
    );

    // TODO: llamado al StepDomain
  }
}
