import { WorkflowExecutionRequest } from '@shared/WorkflowExecutionRequest';

export interface WorkflowExecutionRequestProducer {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(
    key: string,
    request: Omit<WorkflowExecutionRequest, 'executionId'>,
  ): Promise<string>;
}

export const WorkflowExecutionRequestProducer = Symbol(
  'WorkflowExecutionRequestProducer',
);
