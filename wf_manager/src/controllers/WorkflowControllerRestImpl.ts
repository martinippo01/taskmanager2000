import { Put, Body, Controller, Post, Param, Logger } from '@nestjs/common';
import {
  ExecuteWorkflowResponseDto,
  ExecuteWorkflowRequestDto,
} from '@interfaces/types/ExecuteWorkflow';
import { ToggleWorkflowResponseDto } from '@interfaces/types/ToggleWorkflow';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import {
  CreateWorkflowRequestDto,
  CreateWorkflowResponseDto,
} from '@interfaces/types/CreateWorkflow';

@Controller('workflows')
class WorkflowControllerRestImpl {
  private readonly LOGGER = new Logger(WorkflowControllerRestImpl.name);

  constructor(
    private readonly workflowDomain: WorkflowDomain,
    private readonly workflowInputDomain: WorkflowInputDomain,
    private readonly workflowExecutionGateway: WorkflowExecutionGateway,
  ) {}

  @Post()
  async createWorkflow(
    @Body() request: CreateWorkflowRequestDto,
  ): Promise<CreateWorkflowResponseDto> {
    this.LOGGER.debug(`Creating workflow`);
    const workflow = await this.workflowDomain.createWorkflow(request);
    this.LOGGER.log(`Workflow ${workflow ? workflow.name : 'not'} created`);
    return {
      created: workflow !== null,
    };
  }

  @Put(':name/status')
  async toggleWorkflow(
    @Param('name') name: string,
  ): Promise<ToggleWorkflowResponseDto> {
    this.LOGGER.debug(`Toggling workflow ${name}`);
    const enabled = await this.workflowDomain.toggleWorkflow(name);
    this.LOGGER.log(`Workflow ${name} is ${enabled ? 'enabled' : 'disabled'}`);
    return {
      name,
      enabled,
    };
  }

  @Post(':name')
  async executeWorkflow(
    @Param('name') name: string,
    @Body() request: ExecuteWorkflowRequestDto,
  ): Promise<ExecuteWorkflowResponseDto> {
    // 1 - Get workflow
    this.LOGGER.debug(`Executing workflow ${name}`);
    const workflow = await this.workflowDomain.getWorkflow(name);
    if (workflow === null) {
      throw new WorkflowNotFoundException(name);
    }
    // 2 - Validate request input args
    this.LOGGER.debug(`Validating input arguments`);
    const inputArgs = this.workflowInputDomain.getInputArgs(
      workflow,
      request.inputArgs || {},
    );
    // 3 - Call gateway with id and wait for response
    this.LOGGER.debug(`Queueing workflow ${name} for execution`);
    const executionId = await this.workflowExecutionGateway.queueWorkflow(
      workflow,
      inputArgs,
    );
    this.LOGGER.log(
      `Workflow ${name} queued for execution with ID ${executionId}`,
    );
    return {
      queued: !!executionId && executionId.length > 0,
      executionId,
    };
  }
}

export default WorkflowControllerRestImpl;
