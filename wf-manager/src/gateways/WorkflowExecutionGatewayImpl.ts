import { Workflow } from '@interfaces/types/Workflow';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WorkflowExecutionRequestProducer } from '@interfaces/types/WorkflowExecutionRequestProducer';
import { InputArguments } from '@shared/WorkflowInput';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
class WorkflowExecutionGatewayImpl
  implements WorkflowExecutionGateway, OnModuleInit, OnModuleDestroy
{
  private readonly LOGGER = new Logger(WorkflowExecutionGatewayImpl.name);

  constructor(
    @Inject(WorkflowExecutionRequestProducer)
    private readonly producer: WorkflowExecutionRequestProducer,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  async onModuleInit() {
    try {
      this.LOGGER.debug('Connecting producer');
      await this.producer.connect();
    } catch (error) {
      this.LOGGER.error(`Connection error: ${error}`);
      throw new InternalServerErrorException('Failed to connect to producer');
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
    inputArguments: InputArguments,
  ): Promise<string> {
    return this.tracerGateway.trace(
      'WorkflowExecutionGatewayImpl.queueWorkflow',
      async (span) => {
        const { name, description, inputParams, plan } = workflow;
        span.setAttribute('workflow.name', name);

        try {
          this.LOGGER.debug(`Sending workflow ${name} to execution`);
          const executionId = await this.producer.send(name, {
            name,
            description,
            inputParams,
            inputArguments,
            plan,
          });
          span.setAttribute('workflow.execution.queued', true);
          span.setAttribute('workflow.execution.id', executionId);
          return executionId;
        } catch (error) {
          this.LOGGER.error(`Send error: ${error}`);
          throw new InternalServerErrorException(
            `Failed to queue workflow ${name} for execution`,
          );
        }
      },
    );
  }
}

export default WorkflowExecutionGatewayImpl;
