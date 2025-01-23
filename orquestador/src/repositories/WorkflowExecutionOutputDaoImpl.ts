import { WorkflowExecutionOutputDao } from '@interfaces/repository/WorkflowExecutionOutputDao';
import { WorkflowExecutionStepOutput } from '@interfaces/types/StepOutput';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { open } from 'fs/promises';

const nfsPathEnvVar = 'NFS_PATH' as const;

type EnvVars = {
  [nfsPathEnvVar]: string;
};

class WorkflowExecutionOutputDaoImpl implements WorkflowExecutionOutputDao {
  private readonly LOGGER = new Logger(WorkflowExecutionOutputDaoImpl.name);
  private readonly nfsPath: string;

  constructor(private readonly configService: ConfigService<EnvVars>) {
    this.nfsPath = this.configService.get(nfsPathEnvVar, { infer: true })!;
  }

  async getOutput(path: string): Promise<WorkflowExecutionStepOutput> {
    this.LOGGER.debug(`Getting output from path ${path}`);
    const fullPath = `${this.nfsPath}/${path}`;
    this.LOGGER.debug(`Reading file from path ${fullPath}`);
    const fileHandle = await open(fullPath, 'r');
    this.LOGGER.debug(`File opened successfully`);
    this.LOGGER.debug(`Reading content from file`);
    const content = await fileHandle.readFile({ encoding: 'utf-8' });
    this.LOGGER.debug(`Content read successfully`);
    this.LOGGER.debug(`Closing file`);
    await fileHandle.close();
    this.LOGGER.debug(`File closed successfully`);
    return content;
  }
}

export default WorkflowExecutionOutputDaoImpl;
