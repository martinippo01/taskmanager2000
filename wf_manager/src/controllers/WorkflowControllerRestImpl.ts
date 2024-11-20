import { Put, Body, Controller, Post, Param } from '@nestjs/common';
import { Workflow } from '@interfaces/types/Workflow';
import {
  ExecuteWorkflowResponseDto,
  ExecuteWorkflowRequestDto,
} from '@interfaces/types/ExecuteWorkflow';
import { ToggleWorkflowResponseDto } from '@interfaces/types/ToggleWorkflow';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import InvalidWorkflowPlanException from '@exceptions/InvalidWorkflowPlanException';
import {
  CreateWorkflowRequestDto,
  CreateWorkflowResponseDto,
} from '@interfaces/types/CreateWorkflow';

@Controller('workflows')
class WorkflowControllerRestImpl {
  constructor(
    private readonly workflowDomain: WorkflowDomain,
    private readonly workflowPlanDomain: WorkflowPlanDomain,
    private readonly workflowInputDomain: WorkflowInputDomain,
    private readonly workflowExecutionGateway: WorkflowExecutionGateway,
  ) {}

  @Post()
  async createWorkflow(
    @Body() request: CreateWorkflowRequestDto,
  ): Promise<CreateWorkflowResponseDto> {
    if (!this.workflowPlanDomain.isPlanFormatValid(request.plan)) {
      throw new InvalidWorkflowPlanException();
    }
    const inputParams = this.workflowInputDomain.areInputParamsValid(
      request.plan,
      request.inputParams,
    );
    const workflow = await this.workflowDomain.createWorkflow({
      ...request,
      inputParams,
    });
    return {
      created: workflow !== null,
    };
  }

  @Put(':name/status')
  async toggleWorkflow(
    @Param('name') name: string,
  ): Promise<ToggleWorkflowResponseDto> {
    const enabled = await this.workflowDomain.toggleWorkflow(name);
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
    const workflow = await this.workflowDomain.getWorkflow(name);
    if (workflow === null) {
      throw new WorkflowNotFoundException(name);
    }
    // 2 - Validate request input args
    const inputArgs = this.workflowInputDomain.getInputArgs(
      workflow,
      request.inputArgs,
    );
    // 3 - Call gateway
    const queued = await this.workflowExecutionGateway.queueWorkflow(
      workflow,
      inputArgs,
    );
    return {
      queued,
    };
  }
}

export default WorkflowControllerRestImpl;
