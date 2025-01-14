import { InputParams } from './WorkflowInput';

export type KafkaTaskData = {
  brokers: string;
  username: string;
  password: string;
  topic: string;
};

export const isKafkaTaskData = (data: any): data is KafkaTaskData => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  if (
    !('brokers' in data) ||
    typeof data.brokers !== 'string' ||
    !data.brokers
  ) {
    return false;
  }
  if (
    !('username' in data) ||
    typeof data.username !== 'string' ||
    !data.username
  ) {
    return false;
  }
  if (!('password' in data) || typeof data.password !== 'string') {
    return false;
  }
  if (!('topic' in data) || typeof data.topic !== 'string' || !data.topic) {
    return false;
  }
  return true;
};

export const areKafkaTaskDataEqual = (
  taskData1: KafkaTaskData,
  taskData2: KafkaTaskData,
): boolean => {
  return (
    taskData1.brokers === taskData2.brokers &&
    taskData1.username === taskData2.username &&
    taskData1.password === taskData2.password &&
    taskData1.topic === taskData2.topic
  );
};

export type TaskData = {
  kafka: KafkaTaskData;
  params: InputParams;
  optionalParams: string[];
};
