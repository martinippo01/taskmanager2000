import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  stepsInfo,
  WorkflowExecutionDao,
} from '@interfaces/repository/WorkflowExecutionDao';
import { WorkflowExecutionStepDomain } from '@interfaces/domains/WorkflowExecutionStepDomain';
import { Step } from '@shared/WorkflowPlan';
import { WfExecutionStatus } from '@repositories/entities/worflow-execution.entity';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';

@Injectable()
export class WorkflowExecutionStepDomainImpl
  implements WorkflowExecutionStepDomain
{
  private readonly LOGGER = new Logger(WorkflowExecutionStepDomainImpl.name);

  constructor(
    @Inject(WorkflowExecutionDao)
    private readonly workflowExecutionRepository: WorkflowExecutionDao,
    @Inject(StepScheduleRequestGateway)
    private readonly stepScheduleRequestGateway: StepScheduleRequestGateway,
  ) {}

  async runNextStep(executionId: string): Promise<void> {
    this.LOGGER.log(`Running next step for workflow ${executionId}`);

    // Check the persistence for steps and the lasr run step
    const steps: stepsInfo | null =
      await this.workflowExecutionRepository.getStepsFromExecution(executionId);
    if (!steps) {
      this.LOGGER.error(`No steps found for workflow ${executionId}`);
      return; // check if to throw an error
    }

    // Iterate over the steps and match the last one, then get the next one to run it
    let nextStep: Step | undefined = undefined;
    for (let index = 0; index < steps.steps.length; index++) {
      const step = steps.steps[index];
      if (step.name === steps.lastRun && index + 1 < steps.steps.length) {
        nextStep = steps.steps[index + 1];
        break;
      }
    }

    if (nextStep === undefined) {
      // Finish the execution
      this.finishExecution(executionId);
      return;
    } else {
      // call the gateway to schedule the next step
      const stepScheduleRequest: StepScheduleRequest = {
        workflowExecutionId: executionId,
        name: nextStep.name,
        task: nextStep.task,
        inputArgs: nextStep.params,
      };
      this.stepScheduleRequestGateway.queueStep(stepScheduleRequest);

      this.workflowExecutionRepository.updateStatus(
        executionId,
        WfExecutionStatus.STEP_SCHEDULED,
      );
    }
  }

  async saveAnswer(executionId: string, answerPath: string) {
    // Check the persistence for steps and the lasr run step
    const steps: stepsInfo | null =
      await this.workflowExecutionRepository.getStepsFromExecution(executionId);
    if (!steps) {
      this.LOGGER.error(`No steps found for workflow ${executionId}`);
      return; // check if to throw an error
    }
    if (!steps.lastRun) {
      this.LOGGER.error(`No last step run found for workflow ${executionId}`);
      return; // check if to throw an error
    }

    this.workflowExecutionRepository.updateStep(
      executionId,
      steps.lastRun,
      answerPath,
    );

    this.workflowExecutionRepository.updateStatus(
      executionId,
      WfExecutionStatus.STEP_FINISHED,
    );
  }

  async finishExecution(executionId: string) {
    this.workflowExecutionRepository.updateStatus(
      executionId,
      WfExecutionStatus.EXECUTION_FINISHED,
    );
  }
}
