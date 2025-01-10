import { InputParams } from "./WorkflowInput";

export type KafkaTaskData = {
  brokers: string;
  username: string;
  password: string;
  topic: string;
};

export const areKafkaTaskDataEqual = (
  taskData1: KafkaTaskData,
  taskData2: KafkaTaskData
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
  optionalParams: [string];
};
