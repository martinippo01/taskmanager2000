import {
  WfExecutionStatus,
  WorkflowExecution,
} from '@repositories/entities/worflow-execution.entity';

import { InputArguments } from '@shared/WorkflowInput';
import { Step } from '@shared/WorkflowPlan';

export type stepsInfo = {
  steps: Step[];
  lastRun: string | null;
  inputArguments: InputArguments;
};

export interface WorkflowExecutionDao {
  saveWorkflowExecution(
    data: Partial<WorkflowExecution>,
  ): Promise<WorkflowExecution>;

  updateStatus(
    executionId: string,
    newStatus: WfExecutionStatus,
  ): Promise<WorkflowExecution | null>;

  deleteWorkflow(executionId: string): Promise<boolean>;

  // Devuelve todos los steps y el nombre del último que corrió
  getStepsFromExecution(executionId: string): Promise<stepsInfo | null>;

  // wantedOutput es el path del output en donde se va a guardar el resultado de ese step
  // podría ser executionId/stepName total validamos ambos son unicos en principio
  updateStep(executionId: string, lastStepRun: string, wantedOutput: string);

  // Esto es para devolver dónde se debe guardar el resultado (se dispuso ese path en updateStep)
  getStepResultPath(
    executionId: string,
    step: string,
  ): Promise<string | undefined>;
}

export const WorkflowExecutionDao = Symbol('WorkflowExecutionDao');
