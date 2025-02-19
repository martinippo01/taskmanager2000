import { Kafka, logLevel, Producer } from 'kafkajs';
import { InputArguments, InputParams } from './WorkflowInput';
import { randomBytes } from 'crypto';
import { Plan } from './WorkflowPlan';

export type WorkflowExecutionRequest = {
  executionId: string;
  name: string;
  description: string;
  inputParams: InputParams;
  inputArguments: InputArguments;
  plan: Plan;
};

export class WorkflowExecutionRequestProducer {
  private readonly producer: Producer;
  private readonly kafka: Kafka;
  private _isConnected: boolean = false;

  constructor(
    private readonly username: string = process.env.KAFKA_USERNAME || '',
    private readonly password: string = process.env.KAFKA_PASSWORD || '',
    private readonly topic: string = process.env.KAFKA_TOPIC || '',
    private readonly brokers: string = process.env.KAFKA_BROKERS || '',
    private readonly clientId: string = process.env.KAFKA_CLIENT_ID || '',
  ) {
    this.kafka = new Kafka({
      clientId,
      brokers: brokers.split(','),
      ssl: false,
      sasl: {
        mechanism: 'plain',
        username,
        password,
      },
      logLevel: logLevel.ERROR,
    });
    this.producer = this.kafka.producer();
    const { CONNECT, DISCONNECT } = this.producer.events;
    this.producer.on(CONNECT, () => this.setConnected(true));
    this.producer.on(DISCONNECT, () => this.setConnected(false));
  }

  private setConnected(connected: boolean) {
    this._isConnected = connected;
  }

  async connect() {
    await this.producer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
  }

  async send(
    key: string,
    request: Omit<WorkflowExecutionRequest, 'executionId'>,
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Producer is not connected');
    }
    const executionId = randomBytes(20).toString('hex');
    const value = { ...request, executionId };
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key,
          value: JSON.stringify(value),
        },
      ],
    });
    return executionId;
  }

  isConnected(): boolean {
    return this._isConnected;
  }
}
