import {
  nfsStepOutputPathEnvVar,
  NfsStepOutputEnvVars,
} from '@configs/NfsStepOutputConfig';
import StepOutputDaoException from '@exceptions/StepOutputDaoException';
import { WorkflowExecutionOutputDao } from '@interfaces/repository/WorkflowExecutionOutputDao';
import { WorkflowExecutionStepOutput } from '@interfaces/types/StepOutput';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TracerGateway } from '@shared/TracerGateway';
import { open } from 'fs/promises';

class WorkflowExecutionOutputDaoImpl implements WorkflowExecutionOutputDao {
  private readonly LOGGER = new Logger(WorkflowExecutionOutputDaoImpl.name);
  private readonly nfsPath: string;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService<NfsStepOutputEnvVars>,
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {
    this.nfsPath = this.configService.get(nfsStepOutputPathEnvVar, {
      infer: true,
    })!;
  }

  private handleOrThrow<T>(
    promise: Promise<T>,
    error: (cause: unknown) => StepOutputDaoException,
  ): Promise<T> {
    return promise.catch((e) => {
      throw error(e);
    });
  }

  async getOutput(path: string): Promise<WorkflowExecutionStepOutput> {
    return this.tracerGateway.trace(
      'WorkflowExecutionOutputDaoImpl.getOutput',
      async (span) => {
        span.setAttribute('workflow.execution.step.output.path', path);
        this.LOGGER.debug(`Getting output from path ${path}`);
        const fullPath = `${this.nfsPath}/${path}`;
        this.LOGGER.debug(`Reading file from path ${fullPath}`);
        const fileHandle = await this.handleOrThrow(
          open(fullPath, 'r'),
          (cause) =>
            new StepOutputDaoException(`Error opening file ${fullPath}`, cause),
        );
        span.setAttribute('workflow.execution.step.output.file.opened', true);
        this.LOGGER.debug(`File opened successfully`);
        this.LOGGER.debug(`Reading content from file`);
        const content = await this.handleOrThrow(
          fileHandle.readFile({ encoding: 'utf-8' }),
          (cause) =>
            new StepOutputDaoException(`Error reading file ${fullPath}`, cause),
        );
        span.setAttribute('workflow.execution.step.output.content.read', true);
        this.LOGGER.debug(`Content read successfully`);
        this.LOGGER.debug(`Closing file`);
        try {
          await fileHandle.close();
          span.setAttribute('workflow.execution.step.output.file.closed', true);
          this.LOGGER.debug(`File closed successfully`);
        } catch (e) {
          this.LOGGER.warn(`Error closing file ${fullPath}`, e);
        }
        return content;
      },
    );
  }
}

export default WorkflowExecutionOutputDaoImpl;
