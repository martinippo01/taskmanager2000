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

@Controller('workflow-execution')
export class WorkflowExecutionQueryController implements OnModuleInit {
  private readonly LOGGER = new Logger(WorkflowExecutionQueryController.name);
  constructor(
    @Inject(WorkflowExecutionQueryDomain)
    private readonly workflowExecutionQueryDomain: WorkflowExecutionQueryDomain,
  ) {}
  async onModuleInit() {
    this.LOGGER.log('WorkflowExecutionQueryController initialized');
    // Here goes the kafka shit if necessary
  }

  @Get('/:id')
  async getWorkflowExecution(@Param('id') id: string) {
    const response =
      await this.workflowExecutionQueryDomain.getWorkflowExecutionByExecutionId(
        id,
      );
    if (response === null) throw new WorkflowExecutionNotFoundException(id);
    return response;
  }

  @Get('/:id/steps/:stepNum')
  async getStepData(
    @Param('id') id: string,
    @Param('stepNum') stepNum: number,
  ) {
    try {
      return await this.workflowExecutionQueryDomain.getStepDataByExecutionId(
        id,
        stepNum,
      );
    } catch (error) {
      throw new CannotGetStepDataByExecutionId(error.message);
    }
  }

  @Get('/')
  async getExecutionsIdsByName(@Query('name') name: string) {
    if (!!!name) {
      return this.workflowExecutionQueryDomain.listExecutionIds();
    } else {
      const response =
        await this.workflowExecutionQueryDomain.listExecutionIdsByWorkflowName(
          name,
        );
      if (response === null) throw new WorkflowNotFoundException(name);
      return response;
    }
  }
}
