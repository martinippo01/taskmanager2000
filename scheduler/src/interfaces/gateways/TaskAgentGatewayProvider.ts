import { KafkaTaskData } from '@shared/TaskData';
import { InputArguments } from '@shared/WorkflowInput';

export interface TaskAgentGateway {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getKafkaConfig(): KafkaTaskData;
  send(key: string, inputArgs: InputArguments): Promise<void>;
}

export interface TaskAgentGatewayProvider {
  provide({
    username,
    password,
    topic,
    brokers,
    clientId,
  }: {
    username: string;
    password: string;
    topic: string;
    brokers: string;
    clientId: string;
  }): TaskAgentGateway;
}

export const TaskAgentGatewayProvider = Symbol('TaskAgentGatewayProvider');
