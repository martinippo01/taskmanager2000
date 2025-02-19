import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { WorkflowExecutionDao } from '@interfaces/repository/WorkflowExecutionDao';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WfExecutionStatus } from '@repositories/entities/worflow-execution.entity';
import { TracerGateway } from '@shared/TracerGateway';
import { WorkflowExecutionRequest } from '@shared/WorkflowExecutionRequest';
import { mkdir } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class WorkflowExecutionDomainImpl implements WorkflowExecutionDomain {
  private readonly LOGGER = new Logger(WorkflowExecutionDomainImpl.name);

  constructor(
    @Inject(WorkflowExecutionDao)
    private readonly workflowExecutionRepository: WorkflowExecutionDao,
    @Inject(StepScheduleRequestGateway)
    private readonly stepScheduleRequestGateway: StepScheduleRequestGateway,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async runNewWorkflowExecution(
    request: WorkflowExecutionRequest,
  ): Promise<{ alreadyRun: boolean; couldRun: boolean }> {
    return this.tracerGateway.trace(
      'WorkflowExecutionDomainImpl.runNewWorkflowExecution',
      async (span) => {
        span.setAttribute('workflow.execution.id', request.executionId);
        span.setAttribute('workflow.name', request.name);

        try {
          await this.workflowExecutionRepository.saveWorkflowExecution({
            ...request,
          });
          span.addEvent('Workflow execution saved');

          const dirPath = join('/answers', request.executionId);
          await mkdir(dirPath, { recursive: true });
          span.addEvent('Workflow execution directory created');
        } catch (e) {
          this.LOGGER.log(e.message);
          return { alreadyRun: true, couldRun: false };
        }

        const queueRst = await this.tryToRunFirstStep(request);
        span.setAttribute('workflow.execution.queued', queueRst.queued);

        if (!queueRst.queued) this.LOGGER.log(queueRst.error);

        return { alreadyRun: false, couldRun: queueRst.queued };
      },
    );
  }

  async tryToRunFirstStep(request: WorkflowExecutionRequest) {
    return this.tracerGateway.trace(
      'WorkflowExecutionDomainImpl.tryToRunFirstStep',
      async (span) => {
        span.setAttribute('workflow.execution.id', request.executionId);
        span.setAttribute('workflow.name', request.name);
        await this.workflowExecutionRepository.updateStatus(
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
          return { queued: false, error: 'Esto no debería pasar nunca 1!' };
        }
        if (stepsInfo.lastRun) {
          this.LOGGER.error(
            `No parecería ser el primer step, ${request.executionId} has lastRun: ${stepsInfo.lastRun}`,
          );
          return { queued: false, error: 'Esto no debería pasar nunca 2!' };
        }

        const filteredArgs = {};
        const firstStep = stepsInfo.steps[0];

        this.LOGGER.debug(
          `First step of execution ${request.executionId}: ${firstStep}`,
        );

        // ANTES ESTABA EL val.name ACÁ en lugar de val.value
        firstStep.params.forEach((param) => {
          if (param.name in stepsInfo.inputArguments)
            if ('from' in param) {
              this.LOGGER.error(
                `Hay un parámetro con from en el primer paso!!!`,
              );
            } else {
              if (!!param.constant || param.constant === false) {
                filteredArgs[param.name] = request.inputArguments[param.value];
              } else {
                filteredArgs[param.name] = param.value;
              }
            }
          else {
            this.LOGGER.error(
              `Un parámetro necesario para el primer paso (${param.name}) no está en lo que se guardó en la BD`,
            );
            return { queued: false, error: 'Esto no debería pasar nunca 3!' };
          }
        });

        const stepScheduleRequest = {
          workflowExecutionId: request.executionId,
          name: firstStep.name,
          task: firstStep.task,
          inputArgs: filteredArgs,
        };
        const queueRst =
          await this.stepScheduleRequestGateway.queueStep(stepScheduleRequest);
        span.setAttribute('workflow.execution.step.queued', queueRst.queued);

        if (queueRst.queued) {
          this.workflowExecutionRepository.updateStatus(
            request.executionId,
            WfExecutionStatus.STEP_SCHEDULED,
          );
        }

        return queueRst;
      },
    );
  }
}
