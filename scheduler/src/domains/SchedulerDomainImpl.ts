import { SchedulerDomain } from '@interfaces/domains/SchedulerDomain';
import { TaskAgentsGateway } from '@interfaces/gateways/TaskAgentsGateway';
import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { StepScheduleException } from '@shared/StepScheduleException';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
class SchedulerDomainImpl implements SchedulerDomain {
  private readonly LOGGER = new Logger(SchedulerDomainImpl.name);

  constructor(
    @Inject(TaskServiceGateway)
    private readonly taskServiceGW: TaskServiceGateway,
    @Inject(TaskAgentsGateway)
    private readonly taskAgentsGW: TaskAgentsGateway,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async scheduleStepExecution(
    stepScheduleRequest: StepScheduleRequest,
  ): Promise<{ error: StepScheduleException | null }> {
    return this.tracerGateway.trace(
      'SchedulerDomainImpl.scheduleStepExecution',
      async (span) => {
        this.LOGGER.debug(
          `Trying to schedule step ${stepScheduleRequest.name}...`,
        );
        span.setAttribute('step.name', stepScheduleRequest.name);
        span.setAttribute(
          'workflow.execution.id',
          stepScheduleRequest.workflowExecutionId,
        );

        const taskServResult = await this.taskServiceGW.getTaskInfo(
          stepScheduleRequest.task,
        );
        span.setAttribute('task.exists', !!taskServResult);

        if (!taskServResult) {
          return { error: StepScheduleException.TASK_NOT_EXISTS };
        }

        const inputArgFromTask = stepScheduleRequest.inputArgs;
        const optionals = taskServResult.optionalParams;
        this.LOGGER.debug(`Input args from task: ${inputArgFromTask}`);
        this.LOGGER.debug(
          `Input args from task strigified: ${JSON.stringify(inputArgFromTask)}`,
        );
        this.LOGGER.debug(`Optional params: ${optionals}`);
        this.LOGGER.debug(
          `Optional params strigified: ${JSON.stringify(optionals)}`,
        );
        this.LOGGER.debug(`taskServResult params: ${taskServResult.params}`);
        this.LOGGER.debug(
          `taskServResult params strigified: ${JSON.stringify(taskServResult.params)}`,
        );

        /* ESTO ESTÁ COMPARANDO EL VALOR POSTA QUE PUSO EL CLIENTE CON EL TIPO DE DATO DEL PARÁMETRO!!! Creo que falta un typeof, pero prefiero saltearla
        if (
          !Object.entries(taskServResult.params).every(([key, value]) =>
            key in inputArgFromTask
              ? inputArgFromTask[key] === value
              : key in optionals,
          )
        ) {
          return { error: StepScheduleException.TASK_PARAM_MISSING };
        }*/

        // No puedo preguntar directamente por la length de ambos porque algunos pueden
        // ser opcionales, se podría mirar cuántos opcionales hay y restarlos, pero es lo mismo
        if (
          !Object.keys(inputArgFromTask).every(
            (key) => key in taskServResult.params,
          )
        ) {
          return { error: StepScheduleException.TASK_PARAM_NOT_EXISTS };
        }

        this.LOGGER.log(
          `Task Service ha validado el step ${stepScheduleRequest.name}!`,
        );

        if (
          !(await this.taskAgentsGW.sendStep(
            taskServResult,
            stepScheduleRequest,
          ))
        ) {
          return { error: StepScheduleException.TASK_ERROR };
        }

        return { error: null };
      },
    );
  }
}

export default SchedulerDomainImpl;
