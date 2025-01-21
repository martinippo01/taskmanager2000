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
  async getWorkflowExecution(@Param('id') id: string) {}

  @Get('/:id/steps/:stepNum')
  async getStepData(
    @Param('id') id: string,
    @Param('stepNum') stepNum: number,
  ) {}

  @Get('/')
  async getExecutionsIdsByName(@Query('name') name: string) {
    if (!!!name) {
    } else {
    }
  }
}
