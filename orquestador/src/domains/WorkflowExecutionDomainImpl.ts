import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
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
    @Inject(StepScheduleRequestGateway)
    private readonly stepScheduleRequestGateway: StepScheduleRequestGateway,
  ) {}

  async runNewWorkflowExecution(
    request: WorkflowExecutionRequest,
  ): Promise<{ alreadyRun: boolean; couldRun: boolean }> {
    try {
      this.workflowExecutionRepository.saveWorkflowExecution({
        ...request,
      });
    } catch (e) {
      this.LOGGER.log(e.messages);
      return { alreadyRun: true, couldRun: false };
    }

    const queueRst = await this.tryToRunFirstStep(request);

    if (!queueRst.queued) this.LOGGER.log(queueRst.error);

    return { alreadyRun: false, couldRun: queueRst.queued };
  }

  async tryToRunFirstStep(request: WorkflowExecutionRequest) {
    this.workflowExecutionRepository.updateStatus(
      request.executionId,
      WfExecutionStatus.TAKEN,
    );

    // creo que esto no hace falta hacerlo porque la info está en request, pero bueno ya que
    //  estamos revisamos que esté bien cómo guarda las cosas
    const stepsInfo =
      await this.workflowExecutionRepository.getStepsFromExecution(
        request.executionId,
      );

    if (stepsInfo === null) {
      this.LOGGER.error(
        `No existe stepsInfo para executionId: ${request.executionId}`,
      );
      return { queued: false, error: 'Esto no debería pasar nunca!' };
    }
    if (!stepsInfo.lastRun) {
      this.LOGGER.error(
        `No parecería ser el primer step, ${request.executionId} has lastRun: ${stepsInfo.lastRun}`,
      );
      return { queued: false, error: 'Esto no debería pasar nunca!' };
    }

    const filteredArgs = {};
    const firstStep = stepsInfo.steps[0];

    firstStep.params.forEach((val) => {
      if (val.name in stepsInfo.inputArguments)
        filteredArgs[val.name] = stepsInfo.inputArguments[val.name];
      else {
        this.LOGGER.error(
          `Un parámetro necesario para el primer paso (${val.name}) no está en lo que se guardó en la BD`,
        );
        return { queued: false, error: 'Esto no debería pasar nunca!' };
      }
    });

    const stepScheduleRequest = {
      workflowExecutionId: request.executionId,
      name: request.name,
      task: firstStep.task,
      inputArgs: filteredArgs,
    };
    const queueRst =
      await this.stepScheduleRequestGateway.queueStep(stepScheduleRequest);

    if (queueRst.queued) {
      this.workflowExecutionRepository.updateStatus(
        request.executionId,
        WfExecutionStatus.STEP_SCHEDULED,
      );
    }

    return queueRst;
  }
}
