import { Kafka, logLevel, Producer } from "kafkajs";
import { InputArguments, InputParams } from "./WorkflowInput";
import { randomBytes } from "crypto";
import { Plan } from "./WorkflowPlan";

export type WorkflowExecutionRequest = {
  executionId: string;
  name: string;
  description: string;
  inputParams: InputParams;
  inputArgs: InputArguments;
  plan: Plan;
};

const username = process.env.KAFKA_USERNAME || "";
const password = process.env.KAFKA_PASSWORD || "";
const topic = process.env.KAFKA_TOPIC || "";
const brokers = process.env.KAFKA_BROKERS || "";
const clientId = process.env.KAFKA_CLIENT_ID || "";

export class WorkflowExecutionRequestProducer {
  private readonly producer: Producer;
  private readonly kafka: Kafka;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId,
      brokers: brokers.split(","),
      ssl: false,
      sasl: {
        mechanism: "plain",
        username,
        password,
      },
      logLevel: logLevel.ERROR,
    });
    this.producer = this.kafka.producer();
  }

  async connect() {
    await this.producer.connect();
    this.isConnected = true;
  }

  async disconnect() {
    await this.producer.disconnect();
    this.isConnected = false;
  }

  async send(
    key: string,
    request: Omit<WorkflowExecutionRequest, "executionId">
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error("Producer is not connected");
    }
    const executionId = randomBytes(20).toString("hex");
    const value = { ...request, executionId };
    await this.producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(value),
        },
      ],
    });
    return executionId;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
