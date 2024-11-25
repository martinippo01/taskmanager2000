import { Kafka, logLevel, Producer } from "kafkajs";
import { InputArguments, InputParams } from "./WorkflowInput";

export type WorkflowExecutionRequest = {
  executionId: string;
  name: string;
  description: string;
  inputParams: InputParams;
  inputArgs: InputArguments;
  plan: object;
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

  async send(key: string, request: WorkflowExecutionRequest): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Producer is not connected");
    }
    await this.producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(request),
        },
      ],
    });
  }
}
