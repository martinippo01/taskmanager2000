// src/entities/workflow-execution.entity.ts
import { InputArguments, InputParams } from '@shared/WorkflowInput';
import { Plan } from '@shared/WorkflowPlan';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

export enum WfExecutionStatus {
  PERSISTED,
  TAKEN,
  STEP_SCHEDULED,
  STEP_FINISHED,
  EXECUTION_FINISHED,
  ERROR,
}

@Entity('workflow_executions')
export class WorkflowExecution {
  @PrimaryColumn() // no lo hacemos uid porque usamos el que nos pasa el wf-manager
  executionId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('jsonb')
  inputParams: InputParams; // Diccionario de parametros VARIABLES donde las claves son el campo 'value' y el valor es el tipo (campo 'type'). NO SE USA

  @Column('jsonb')
  inputArguments: InputArguments; // Diccionario de parametros VARIABLES donde las claves son el campo 'value' y el valor es el valor definido por el usuario

  @Column('jsonb')
  plan: Plan; // Es la lista de steps que se van a ejecutar

  // Chequear que ese default funciona
  @Column('jsonb', { default: {} })
  outputs: Record<string, string | undefined>;

  @Column({ default: WfExecutionStatus.PERSISTED })
  status: WfExecutionStatus;

  @Column({ default: null, nullable: true })
  errorReason: string;

  @Column({ default: null, nullable: true })
  lastStepRun: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
