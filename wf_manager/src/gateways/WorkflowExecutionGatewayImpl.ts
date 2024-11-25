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
import { WorkflowExecutionRequestProducer } from 'shared/lib/WorkflowExecutionRequest';

@Injectable()
class WorkflowExecutionGatewayImpl
  implements WorkflowExecutionGateway, OnModuleInit, OnModuleDestroy
{
  private readonly producer: WorkflowExecutionRequestProducer;
  private readonly LOGGER = new Logger(WorkflowExecutionGatewayImpl.name);

  constructor() {
    this.producer = new WorkflowExecutionRequestProducer();
  }

  async onModuleInit() {
    try {
      this.LOGGER.debug('Connecting producer');
      await this.producer.connect();
    } catch (error) {
      this.LOGGER.error(`Connection error: ${error}`);
    }
  }

  async onModuleDestroy() {
    try {
      this.LOGGER.debug('Disconnecting producer');
      await this.producer.disconnect();
    } catch (error) {
      this.LOGGER.error(`Disconnection error: ${error}`);
    }
  }

  async queueWorkflow(
    workflow: Workflow,
    inputArgs: InputArguments,
  ): Promise<boolean> {
    const { name, description, inputParams } = workflow;
    try {
      this.LOGGER.debug(`Sending workflow ${name} to execution`);
      await this.producer.send(name, {
        executionId: '123',
        name,
        description,
        inputParams,
        inputArgs,
        plan: {},
      });
      return true;
    } catch (error) {
      this.LOGGER.error(`Send error: ${error}`);
      throw new InternalServerErrorException(
        'Failed to queue workflow for execution',
      );
    }
  }
}

export default WorkflowExecutionGatewayImpl;
