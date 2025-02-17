import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  stepsInfo,
  WorkflowExecutionDao,
} from '@interfaces/repository/WorkflowExecutionDao';
import { WorkflowExecutionStepDomain } from '@interfaces/domains/WorkflowExecutionStepDomain';
import { Step } from '@shared/WorkflowPlan';
import {
  WfExecutionStatus,
  WorkflowExecution,
} from '@repositories/entities/worflow-execution.entity';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { StepScheduleRequest } from '@shared/StepScheduleRequest';
import { InputArguments } from '@shared/WorkflowInput';

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
    const wf_exec: WorkflowExecution | null =
      await this.workflowExecutionRepository.getWorkflowExecutionById(
        executionId,
      );
    if (!steps || !wf_exec) {
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
      const stepArguments: InputArguments = {};
      nextStep.params.forEach((param) => {
        if ('from' in param) {
          stepArguments[param.name] = ''; // TODO: Obtener el valor desde el NFS;
        } else {
          if (!!param.constant || param.constant === false) {
            stepArguments[param.name] = wf_exec.inputArguments[param.value];
          } else {
            stepArguments[param.name] = param.value;
          }
        }
        // segun el tipo determinado, hacer un parseo para validar que el valor que se asigne sea el indicado.
      });

      if (
        this.checkInternal(executionId, nextStep, stepArguments, steps, wf_exec)
      ) {
        return;
      }

      // call the gateway to schedule the next step
      const stepScheduleRequest: StepScheduleRequest = {
        workflowExecutionId: executionId,
        name: nextStep.name,
        task: nextStep.task,
        inputArgs: stepArguments,
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

    await this.workflowExecutionRepository.updateStep(
      executionId,
      steps.lastRun,
      answerPath,
    );

    await this.workflowExecutionRepository.updateStatus(
      executionId,
      WfExecutionStatus.STEP_FINISHED,
    );
  }

  async finishExecution(executionId: string) {
    await this.workflowExecutionRepository.updateStatus(
      executionId,
      WfExecutionStatus.EXECUTION_FINISHED,
    );
  }

  async handleError(executionId: string, error: string): Promise<void> {
    this.LOGGER.error(`Error in workflow with ID ${executionId}: ${error}`);
    try {
      await this.workflowExecutionRepository.markExecutionAsError(
        executionId,
        error,
      );
    } catch (error) {
      this.LOGGER.error(
        `Failed to mark workflow with ID ${executionId} as error:`,
        error,
      );
      throw new Error('Unable to mark workflow as error');
    }
  }

  runDecision(
    executionId,
    stepArguments,
    stepsInfo: stepsInfo,
    wf_exec: WorkflowExecution,
  ) {
    const condition = stepArguments['condition'];
    let wasSuccess = false;
    const firstArg = stepArguments['left'];
    const secondArg = stepArguments['right'];

    if (condition === 'equals') {
      wasSuccess = firstArg == secondArg;
    } else if (condition === 'greater') {
      wasSuccess = firstArg > secondArg;
    } else if (condition === 'smaller') {
      wasSuccess = firstArg < secondArg;
    }

    let stepToRunName;
    if (wasSuccess) {
      // Go to success task
      stepToRunName = stepArguments['success'];
    } else {
      // Go to failure task
      stepToRunName = stepArguments['failure'];
    }

    const stepToRun = stepsInfo.steps.find(
      (step) => step.name === stepToRunName,
    );

    const newStepArguments: InputArguments = {};
    if (stepToRun) {
      stepToRun.params.forEach((param) => {
        if ('from' in param) {
          newStepArguments[param.name] = ''; // TODO: Obtener el valor desde el NFS;
        } else {
          if (!!param.constant || param.constant === false) {
            newStepArguments[param.name] = wf_exec.inputArguments[param.value];
          } else {
            newStepArguments[param.name] = param.value;
          }
        }
      });
    } else {
      this.LOGGER.error(
        `Problema! No existe el step de la decision ${stepToRunName}, tenemos ${stepsInfo.steps}`,
      );
      return;
    }

    if (
      this.checkInternal(
        executionId,
        stepToRun,
        stepArguments,
        stepsInfo,
        wf_exec,
      )
    ) {
      return;
    }

    const stepScheduleRequest: StepScheduleRequest = {
      workflowExecutionId: executionId,
      name: stepToRun.name,
      task: stepToRun.task,
      inputArgs: newStepArguments,
    };
    this.stepScheduleRequestGateway.queueStep(stepScheduleRequest);

    this.workflowExecutionRepository.updateStatus(
      executionId,
      WfExecutionStatus.STEP_SCHEDULED,
    );
  }

  runUpper(executionId, stepArguments, step_name: string) {
    const arg = stepArguments['argument_to_upper'];
    if (typeof arg === 'string') {
      stepArguments['argument_to_upper'] = arg.toUpperCase();
    }
    // TODO: FALTA GUARDAR EN EL NFS

    this.saveAnswer(executionId, `${executionId}/${step_name}`);
  }

  runLower(executionId, stepArguments, step_name: string) {
    const arg = stepArguments['argument_to_lower'];
    if (typeof arg === 'string') {
      stepArguments['argument_to_lower'] = arg.toLowerCase();
    }

    // TODO: FALTA GUARDAR EN EL NFS

    this.saveAnswer(executionId, `${executionId}/${step_name}`);
  }

  checkInternal(
    executionId,
    nextStep: Step,
    stepArguments,
    steps,
    wf_exec,
  ): boolean {
    this.LOGGER.debug(
      `Checking if it is internal: ${nextStep.task} of execId ${executionId}`,
    );
    if (nextStep.task === 'decision') {
      this.runDecision(executionId, stepArguments, steps, wf_exec);
    } else if (nextStep.task === 'upper') {
      this.runUpper(executionId, stepArguments, nextStep.name);
    } else if (nextStep.task === 'lower') {
      this.runLower(executionId, stepArguments, nextStep.name);
    } else {
      return false;
    }
    this.LOGGER.debug(
      `Just run Internal thingy ${nextStep.task} of execId ${executionId}`,
    );
    return true;
  }
}
