// src/entities/workflow-execution.entity.ts
import { InputArguments, InputParams } from '@shared/WorkflowInput';
import { Plan } from '@shared/WorkflowPlan';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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
  @PrimaryGeneratedColumn() // no lo hacemos uid porque usamos el que nos pasa el wf-manager
  executionId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('jsonb')
  inputParams: InputParams;

  @Column('jsonb')
  inputArguments: InputArguments;

  @Column('jsonb')
  plan: Plan;

  // Chequear que ese default funciona
  @Column('jsonb', { default: {} })
  outputs: Record<string, string | undefined>;

  @Column({ default: WfExecutionStatus.PERSISTED })
  status: WfExecutionStatus;

  @Column({ default: null, nullable: true })
  errorReason: string | null;

  @Column({ default: null })
  lastStepRun: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
