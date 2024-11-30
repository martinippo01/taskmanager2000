import { Workflow } from '@interfaces/types/Workflow';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InputArguments } from 'shared/lib/WorkflowInput';
import { WorkflowExecutionRequestProducer as WorkflowExecutionRequestProducerImpl } from 'shared/lib/WorkflowExecutionRequest';
import { WorkflowExecutionRequestProducer } from '@interfaces/types/WorkflowExecutionRequestProducer';

@Injectable()
class WorkflowExecutionGatewayImpl
  implements WorkflowExecutionGateway, OnModuleInit, OnModuleDestroy
{
  private readonly producer: WorkflowExecutionRequestProducer;
  private readonly LOGGER = new Logger(WorkflowExecutionGatewayImpl.name);

  constructor() {
    this.producer = new WorkflowExecutionRequestProducerImpl();
  }

  async onModuleInit() {
    try {
      this.LOGGER.debug('Connecting producer');
      await this.producer.connect();
    } catch (error) {
      this.LOGGER.error(`Connection error: ${error}`);
      // throw new InternalServerErrorException('Failed to connect to producer');
    }
  }

  async onModuleDestroy() {
    try {
      this.LOGGER.debug('Disconnecting producer');
      await this.producer.disconnect();
    } catch (error) {
      this.LOGGER.error(`Disconnection error: ${error}`);
      throw new InternalServerErrorException(
        'Failed to disconnect from producer',
      );
    }
  }

  async queueWorkflow(
    workflow: Workflow,
    inputArgs: InputArguments,
  ): Promise<string> {
    const { name, description, inputParams, plan } = workflow;
    try {
      this.LOGGER.debug(`Sending workflow ${name} to execution`);
      const executionId = await this.producer.send(name, {
        name,
        description,
        inputParams,
        inputArgs,
        plan,
      });
      return executionId;
    } catch (error) {
      this.LOGGER.error(`Send error: ${error}`);
      throw new InternalServerErrorException(
        `Failed to queue workflow ${name} for execution`,
      );
    }
  }
}

export default WorkflowExecutionGatewayImpl;
