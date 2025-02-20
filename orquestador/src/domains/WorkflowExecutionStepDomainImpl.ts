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
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { TracerGateway } from '@shared/TracerGateway';

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
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async runNextStep(executionId: string): Promise<void> {
    return this.tracerGateway.trace(
      'WorkflowExecutionStepDomainImpl.runNextStep',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);

        this.LOGGER.log(`Running next step for workflow ${executionId}`);

        // Check the persistence for steps and the lasr run step
        const steps: stepsInfo | null =
          await this.workflowExecutionRepository.getStepsFromExecution(
            executionId,
          );
        const wf_exec: WorkflowExecution | null =
          await this.workflowExecutionRepository.getWorkflowExecutionById(
            executionId,
          );
        if (!steps || !wf_exec) {
          if (!wf_exec) span.addEvent('Workflow execution not found');
          if (!steps) span.addEvent('Steps not found');
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
          await this.finishExecution(executionId);
          return;
        } else {
          const stepArguments: InputArguments = {};
          for (const param of nextStep.params) {
            if ('from' in param) {
              const filePath = join('/answers', executionId, param.from);
              this.LOGGER.debug(`Reading from ${filePath}`);

              try {
                const value = (await readFile(filePath, 'utf8')).trim();
                this.LOGGER.debug(`Read value: ${value}`);
                stepArguments[param.name] = value;
              } catch (error) {
                console.error(`Failed to read value from NFS: ${error}`);
                stepArguments[param.name] = ''; // Default to empty string if reading fails
              }
            } else {
              if (!('constant' in param) || param.constant === false) {
                stepArguments[param.name] = wf_exec.inputArguments[param.value];
              } else {
                stepArguments[param.name] = param.value;
              }
            }
            // segun el tipo determinado, hacer un parseo para validar que el valor que se asigne sea el indicado.
          }

          if (
            await this.checkInternal(
              executionId,
              nextStep,
              stepArguments,
              steps,
              wf_exec,
            )
          ) {
            await this.runNextStep(executionId);
            return;
          }

          // call the gateway to schedule the next step
          const stepScheduleRequest: StepScheduleRequest = {
            workflowExecutionId: executionId,
            name: nextStep.name,
            task: nextStep.task,
            inputArgs: stepArguments,
          };
          await this.stepScheduleRequestGateway.queueStep(stepScheduleRequest);
          span.setAttribute('workflow.execution.step.queued', true);

          await this.workflowExecutionRepository.updateStatus(
            executionId,
            WfExecutionStatus.STEP_SCHEDULED,
          );
          span.setAttribute('workflow.execution.status.updated', true);
        }
      },
    );
  }

  async saveAnswer(
    executionId: string,
    answerPath: string,
    name: string,
  ): Promise<void> {
    return this.tracerGateway.trace(
      'WorkflowExecutionStepDomainImpl.saveAnswer',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        span.setAttribute('workflow.execution.answer', answerPath);
        span.setAttribute('workflow.execution.step.name', name);
        // Check the persistence for steps and the lasr run step
        const steps: stepsInfo | null =
          await this.workflowExecutionRepository.getStepsFromExecution(
            executionId,
          );
        if (!steps) {
          span.addEvent('Steps not found');
          this.LOGGER.error(`No steps found for workflow ${executionId}`);
          return; // check if to throw an error
        }
        /*
        // Entonces es el primero
        let lastRun: string | undefined = undefined;
        if (!steps.lastRun) {
          span.addEvent(
            'Last step not found. This is probably the first step!',
          );
          this.LOGGER.debug(
            `No last step run found for workflow ${executionId}. This is probably the first step!`,
          );
          lastRun = steps.steps[0].name;
        } else {
          this.LOGGER.debug(
            `steps.lastRun = ${steps.lastRun}, looking for the one that was JUST run`,
          );
          for (let index = 0; index < steps.steps.length; index++) {
            const step = steps.steps[index];
            if (step.name === steps.lastRun && index + 1 < steps.steps.length) {
              lastRun = steps.steps[index + 1].name;
              break;
            }
          }
        }

        if (lastRun === undefined) {
          this.LOGGER.error(
            `Acá no debería entrar nunca! Significa que el lastRun que había ya era el último step!`,
          );
          return;
        }*/

        await this.workflowExecutionRepository.updateStep(
          executionId,
          answerPath,
          name,
        );
        span.setAttribute('workflow.execution.step.answer.saved', true);

        await this.workflowExecutionRepository.updateStatus(
          executionId,
          WfExecutionStatus.STEP_FINISHED,
        );
        span.setAttribute('workflow.execution.status.updated', true);
      },
    );
  }

  async finishExecution(executionId: string) {
    return this.tracerGateway.trace(
      'WorkflowExecutionStepDomainImpl.finishExecution',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        await this.workflowExecutionRepository.updateStatus(
          executionId,
          WfExecutionStatus.EXECUTION_FINISHED,
        );
        this.LOGGER.log(`Workflow with ID ${executionId} finished!`);
        span.setAttribute('workflow.execution.status.updated', true);
      },
    );
  }

  async handleError(executionId: string, error: string): Promise<void> {
    return this.tracerGateway.trace(
      'WorkflowExecutionStepDomainImpl.handleError',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        span.setAttribute('workflow.execution.error', error);
        this.LOGGER.error(`Error in workflow with ID ${executionId}: ${error}`);
        try {
          await this.workflowExecutionRepository.markExecutionAsError(
            executionId,
            error,
          );
          span.setAttribute('workflow.execution.marked.error', true);
        } catch (error) {
          span.setAttribute('workflow.execution.marked.error', false);
          this.LOGGER.error(
            `Failed to mark workflow with ID ${executionId} as error:`,
            error,
          );
          throw new Error('Unable to mark workflow as error');
        }
      },
    );
  }

  async runDecision(
    executionId,
    stepArguments,
    stepsInfo: stepsInfo,
    wf_exec: WorkflowExecution,
  ) {
    return this.tracerGateway.trace(
      'WorkflowExecutionStepDomainImpl.runDecision',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
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
          for (const param of stepToRun.params) {
            if ('from' in param) {
              const filePath = join('/answers', executionId, param.from);

              try {
                const value = await readFile(filePath, 'utf-8'); // Read the file content as a string
                stepArguments[param.name] = value.trim(); // Trim to remove any extra newlines
              } catch (error) {
                console.error(`Failed to read value from NFS: ${error}`);
                stepArguments[param.name] = ''; // Default to empty string if reading fails
              }
            } else {
              if (!('constant' in param) || param.constant === false) {
                newStepArguments[param.name] =
                  wf_exec.inputArguments[param.value];
              } else {
                newStepArguments[param.name] = param.value;
              }
            }
          }
        } else {
          span.addEvent('Step not found');
          this.LOGGER.error(
            `Problema! No existe el step de la decision ${stepToRunName}, tenemos ${stepsInfo.steps}`,
          );
          return;
        }

        if (
          await this.checkInternal(
            executionId,
            stepToRun,
            newStepArguments,
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
        span.setAttribute('workflow.execution.step.queued', true);

        this.workflowExecutionRepository.updateStatus(
          executionId,
          WfExecutionStatus.STEP_SCHEDULED,
        );
        span.setAttribute('workflow.execution.status.updated', true);
      },
    );
  }

  runUpper(executionId, stepArguments, step_name: string) {
    const arg = stepArguments['argument_to_upper'];
    let rst: string = 'Nadaaa';
    if (typeof arg === 'string') {
      rst = arg.toUpperCase();
    }
    this.saveOnNFS(executionId, rst, step_name);
  }

  runLower(executionId, stepArguments, step_name: string) {
    const arg = stepArguments['argument_to_lower'];
    let rst: string = 'Nadaaa';
    if (typeof arg === 'string') {
      rst = arg.toLowerCase();
    }
    this.saveOnNFS(executionId, rst, step_name);
  }

  async saveOnNFS(executionId, rst: string, step_name: string) {
    return this.tracerGateway.trace(
      'WorkflowExecutionStepDomainImpl.saveOnNFS',
      async (span) => {
        span.setAttribute('workflow.execution.id', executionId);
        span.setAttribute('workflow.execution.step.name', step_name);

        if (rst !== null) {
          const nfsPath = join('/answers', executionId, step_name);

          try {
            await writeFile(nfsPath, rst, 'utf-8');
            span.setAttribute('workflow.execution.step.result.saved', true);
            console.log(`Saved result to ${nfsPath}`);
          } catch (error) {
            span.setAttribute('workflow.execution.step.result.saved', false);
            console.error(`Failed to save result to NFS: ${error}`);
          }
        }

        await this.saveAnswer(
          executionId,
          `/answers/${executionId}/${step_name}`,
          step_name,
        );
        span.setAttribute('workflow.execution.step.answer.saved', true);
      },
    );
  }

  async checkInternal(
    executionId,
    nextStep: Step,
    stepArguments,
    steps,
    wf_exec,
  ): Promise<boolean> {
    this.LOGGER.debug(
      `Checking if it is internal: ${nextStep.task} of execId ${executionId}`,
    );
    if (nextStep.task === 'decision') {
      await this.runDecision(executionId, stepArguments, steps, wf_exec);
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
