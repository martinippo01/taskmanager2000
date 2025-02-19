import CannotGetStepDataByExecutionId from '@exceptions/CannotGetStepDataByExecutionId';
import WorkflowExecutionNotFoundException from '@exceptions/WorkflowExecutionNotFoundException';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import { WorkflowExecutionQueryDomain } from '@interfaces/domains/WorklowExecutionQueryDomain';
import {
  Controller,
  Get,
  Inject,
  Logger,
  OnModuleInit,
  Param,
  Query,
} from '@nestjs/common';
import { TracerGateway } from '@shared/TracerGateway';

@Controller('workflow-execution')
export class WorkflowExecutionQueryController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionQueryController.name);
  constructor(
    @Inject(WorkflowExecutionQueryDomain)
    private readonly workflowExecutionQueryDomain: WorkflowExecutionQueryDomain,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}
  async onModuleInit() {
    this.LOGGER.log('WorkflowExecutionQueryController initialized');
    // Here goes the kafka shit if necessary
  }

  @Get('/:id')
  async getWorkflowExecution(@Param('id') id: string) {
    return this.tracerGateway.trace(
      'WorkflowExecutionQueryController.getWorkflowExecution',
      async (span) => {
        span.setAttribute('workflow.execution.id', id);

        const response =
          await this.workflowExecutionQueryDomain.getWorkflowExecutionByExecutionId(
            id,
          );
        span.addEvent('Workflow execution not found');
        if (response === null) throw new WorkflowExecutionNotFoundException(id);
        return response;
      },
    );
  }

  @Get('/answer/:id')
  async getAnswerByWorkflowExecutionId(@Param('id') id: string) {
    return this.tracerGateway.trace(
      'WorkflowExecutionQueryController.getAnswerByWorkflowExecutionId',
      async (span) => {
        span.setAttribute('workflow.execution.id', id);

        const response =
          await this.workflowExecutionQueryDomain.getAnswerByWorkflowExecutionId(
            id,
          );
        if (response === null) throw new WorkflowExecutionNotFoundException(id);
        return response;
      },
    );
  }

  @Get('/:id/steps/:stepNum')
  async getStepData(
    @Param('id') id: string,
    @Param('stepNum') stepNum: number,
  ) {
    return this.tracerGateway.trace(
      'WorkflowExecutionQueryController.getStepData',
      async (span) => {
        span.setAttribute('workflow.execution.id', id);
        span.setAttribute('workflow.execution.step.number', stepNum);
        try {
          return await this.workflowExecutionQueryDomain.getStepDataByExecutionId(
            id,
            stepNum,
          );
        } catch (error) {
          span.addEvent('Workflow execution step not found');
          throw new CannotGetStepDataByExecutionId(error.message);
        }
      },
    );
  }

  @Get('/')
  async getExecutionsIdsByName(@Query('name') name: string) {
    return this.tracerGateway.trace(
      'WorkflowExecutionQueryController.getExecutionsIdsByName',
      async (span) => {
        if (!!name) {
          span.setAttribute('workflow.name', name);
        }
        if (!!!name) {
          span.addEvent('Listing all workflow executions');
          return this.workflowExecutionQueryDomain.listExecutionIds();
        } else {
          const response =
            await this.workflowExecutionQueryDomain.listExecutionIdsByWorkflowName(
              name,
            );
          span.addEvent('Workflow execution not found');
          if (response === null) throw new WorkflowNotFoundException(name);
          return response;
        }
      },
    );
  }
}
