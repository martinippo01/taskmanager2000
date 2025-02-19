import {
  Put,
  Body,
  Controller,
  Post,
  Param,
  Query,
  Logger,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ExecuteWorkflowResponseDto,
  ExecuteWorkflowRequestDto,
} from '@interfaces/types/ExecuteWorkflow';
import { ToggleWorkflowResponseDto } from '@interfaces/types/ToggleWorkflow';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import WorkflowNotFoundException from '@exceptions/WorkflowNotFoundException';
import { CreateWorkflowResponseDto } from '@interfaces/types/CreateWorkflow';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkflowNameParam } from '@interfaces/types/WorkflowName';
import DisabledWorkflowException from '@exceptions/DisabledWorkflowException';
import { TracerGateway } from '@shared/TracerGateway';

@Controller('workflows')
class WorkflowControllerRestImpl {
  private readonly LOGGER = new Logger(WorkflowControllerRestImpl.name);

  constructor(
    @Inject(WorkflowDomain) private readonly workflowDomain: WorkflowDomain,
    @Inject(WorkflowInputDomain)
    private readonly workflowInputDomain: WorkflowInputDomain,
    @Inject(WorkflowExecutionGateway)
    private readonly workflowExecutionGateway: WorkflowExecutionGateway,
    @Inject(TracerGateway)
    private readonly tracerGateway: TracerGateway,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createWorkflow(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'yaml',
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024, // 1MB
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file: Express.Multer.File,
  ): Promise<CreateWorkflowResponseDto> {
    return this.tracerGateway.trace(
      'WorkflowControllerRestImpl.createWorkflow',
      async (span) => {
        this.LOGGER.debug(`Creating workflow`);
        const fileContent = file.buffer.toString('utf8');
        const workflow = await this.workflowDomain.createWorkflow(fileContent);
        this.LOGGER.log(`Workflow ${workflow ? workflow.name : 'not'} created`);
        span.setAttribute('workflow.created', workflow !== null);
        if (workflow) {
          span.setAttribute('workflow.name', workflow.name);
          span.setAttribute('workflow.version', workflow.version);
        }
        return {
          created: workflow !== null,
        };
      },
    );
  }

  @Put(':name/status')
  async toggleWorkflow(
    @Param() params: WorkflowNameParam,
    @Query('version') version?: string,
  ): Promise<ToggleWorkflowResponseDto> {
    return this.tracerGateway.trace(
      'WorkflowControllerRestImpl.toggleWorkflow',
      async (span) => {
        span.setAttribute('workflow.name', params.name);
        if (version) span.setAttribute('workflow.version', version);
        const { name } = params;
        this.LOGGER.debug(`Toggling workflow ${name}`);
        const enabled = await this.workflowDomain.toggleWorkflow(name, version);
        this.LOGGER.log(
          `Workflow ${name} is ${enabled ? 'enabled' : 'disabled'}`,
        );
        span.setAttribute('workflow.enabled', enabled);
        return {
          name,
          version,
          enabled,
        };
      },
    );
  }

  @Post(':name')
  async executeWorkflow(
    @Param() params: WorkflowNameParam,
    @Body() request: ExecuteWorkflowRequestDto,
    @Query('version') version?: string,
  ): Promise<ExecuteWorkflowResponseDto> {
    return this.tracerGateway.trace(
      'WorkflowControllerRestImpl.executeWorkflow',
      async (span) => {
        const { name } = params;
        span.setAttribute('workflow.name', name);
        if (version) span.setAttribute('workflow.version', version);
        // 1 - Get workflow
        this.LOGGER.debug(`Executing workflow ${name}`);
        const workflow = await this.workflowDomain.getWorkflow(name, version);
        if (workflow === null) {
          throw new WorkflowNotFoundException(name);
        }
        if (!workflow.enabled) {
          throw new DisabledWorkflowException(name);
        }
        // 2 - Validate request input arguments
        this.LOGGER.debug(`Validating input arguments`);
        const inputArgs = await this.workflowInputDomain.getInputArgs(
          workflow,
          request.inputArguments || {},
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
        const queued = !!executionId && executionId.length > 0;
        span.setAttribute('workflow.queued', queued);
        if (queued) {
          span.setAttribute('workflow.execution_id', executionId);
        }
        return {
          queued,
          executionId,
        };
      },
    );
  }
}

export default WorkflowControllerRestImpl;
