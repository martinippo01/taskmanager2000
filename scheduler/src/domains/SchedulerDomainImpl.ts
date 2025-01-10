import { SchedulerDomain } from '@interfaces/domains/SchedulerDomain';
import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { StepScheduleException } from '@shared/StepScheduleException';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';

@Injectable()
class SchedulerDomainImpl implements SchedulerDomain {
  private readonly LOGGER = new Logger(SchedulerDomainImpl.name);

  constructor(
    @Inject(TaskServiceGateway)
    private readonly taskServiceGW: TaskServiceGateway,
  ) {}

  async scheduleStepExecution(
    stepScheduleRequest: StepScheduleRequest,
  ): Promise<{ error: StepScheduleException | null }> {
    // Chequear si debería tirar error
    const tsResult = await this.taskServiceGW.checkParameters(
      stepScheduleRequest.task,
      stepScheduleRequest.inputArgs,
    );

    if (!tsResult.success) {
      return { error: tsResult.error };
    }

    this.LOGGER.log(
      `Task Service ha validado el step ${stepScheduleRequest.name}!`,
    );

    // TODO: Llamar al TaskAgentsGateway

    return { error: null };
  }
}

export default SchedulerDomainImpl;
