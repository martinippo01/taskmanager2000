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
        span.setAttribute(
          'workflow.argumentsStringified',
          JSON.stringify(inputArguments),
        );

        try {
          this.LOGGER.debug(`Sending workflow ${name} to execution`);
          this.LOGGER.debug(`Workflow: ${JSON.stringify(workflow)}`);
          this.LOGGER.debug(`Input arguments: ${inputArguments}`);
          this.LOGGER.debug(
            `Input arguments Stringified: ${JSON.stringify(inputArguments)}. Length: ${inputArguments.length}`,
          );

          const executionId = await this.producer.send(name, {
            name,
            description,
            inputParams,
            plan,
            inputArguments,
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
