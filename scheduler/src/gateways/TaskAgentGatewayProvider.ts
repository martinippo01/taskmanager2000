import {
  TaskAgentGateway,
  TaskAgentGatewayProvider,
} from '@interfaces/gateways/TaskAgentGatewayProvider';
import { TaskAgentRequest } from '@shared/TaskAgentRequest';
import { KafkaTaskData } from '@shared/TaskData';
import { Kafka, logLevel, Producer } from 'kafkajs';

class TaskAgentGatewayImpl implements TaskAgentGateway {
  private readonly producer: Producer;
  private readonly kafka: Kafka;
  private _isConnected: boolean = false;

  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly topic: string,
    private readonly brokers: string,
    private readonly clientId: string,
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

  private setConnected(connected: boolean): void {
    this._isConnected = connected;
  }

  getKafkaConfig(): KafkaTaskData {
    return {
      brokers: this.brokers,
      username: this.username,
      password: this.password,
      topic: this.topic,
    };
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async send(key: string, request: TaskAgentRequest): Promise<void> {
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key,
          value: JSON.stringify(request),
        },
      ],
    });
  }
}

export class TaskAgentGatewayProviderImpl implements TaskAgentGatewayProvider {
  public provide({
    username,
    password,
    topic,
    brokers,
    clientId,
  }: KafkaTaskData & { clientId: string }): TaskAgentGateway {
    return new TaskAgentGatewayImpl(
      username,
      password,
      topic,
      brokers,
      clientId,
    );
  }
}
