import {
  NfsStepOutputEnvVars,
  nfsStepOutputPathEnvVar,
} from '@configs/NfsStepOutputConfig';
import StepOutputDaoException from '@exceptions/StepOutputDaoException';
import { WorkflowExecutionStepOutput } from '@interfaces/types/StepOutput';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import WorkflowExecutionOutputDaoImpl from '@repositories/WorkflowExecutionOutputDaoImpl';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';
import { FileHandle } from 'fs/promises';
import * as fs from 'fs/promises';

describe('WorkflowExecutionOutputDaoImpl', () => {
  const workflowExecutionStepOutputExample: WorkflowExecutionStepOutput =
    'output';
  const nfsPath = 'nfsPath';

  let workflowExecutionOutputDaoImpl: WorkflowExecutionOutputDaoImpl;
  let configServiceMock: jest.Mocked<ConfigService<NfsStepOutputEnvVars>>;
  let fileHandleMock: jest.Mocked<FileHandle>;
  let fsOpenSpy: jest.SpyInstance;

  beforeEach(async () => {
    configServiceMock = {
      get: jest.fn().mockReturnValue(nfsPath),
    } as unknown as jest.Mocked<ConfigService<NfsStepOutputEnvVars>>;

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        WorkflowExecutionOutputDaoImpl,
        tracerGatewayMockProvider,
      ],
    }).compile();

    module.useLogger(false);

    workflowExecutionOutputDaoImpl = module.get<WorkflowExecutionOutputDaoImpl>(
      WorkflowExecutionOutputDaoImpl,
    );
    fileHandleMock = {
      close: jest.fn(),
      readFile: jest.fn(),
    } as unknown as jest.Mocked<FileHandle>;
    fsOpenSpy = jest.spyOn(fs, 'open');
  });

  describe('getOutput', () => {
    it('should return the output of a step', async () => {
      const path = 'path';

      fsOpenSpy.mockResolvedValue(fileHandleMock);
      fileHandleMock.readFile.mockResolvedValue(
        workflowExecutionStepOutputExample,
      );
      fileHandleMock.close.mockResolvedValue(undefined);

      const output = await workflowExecutionOutputDaoImpl.getOutput(path);

      expect(output).toBe(workflowExecutionStepOutputExample);
      expect(configServiceMock.get).toHaveBeenCalledWith(
        nfsStepOutputPathEnvVar,
        {
          infer: true,
        },
      );
      expect(fsOpenSpy).toHaveBeenCalledWith(`${nfsPath}/${path}`, 'r');
      expect(fileHandleMock.readFile).toHaveBeenCalledWith({
        encoding: 'utf-8',
      });
      expect(fileHandleMock.close).toHaveBeenCalled();
    });

    it('should throw an error if the file cannot be opened', async () => {
      const path = 'path';

      fsOpenSpy.mockRejectedValue(new Error());

      await expect(
        workflowExecutionOutputDaoImpl.getOutput(path),
      ).rejects.toThrow(StepOutputDaoException);
    });

    it('should throw an error if the file cannot be read', async () => {
      const path = 'path';

      fsOpenSpy.mockResolvedValue(fileHandleMock);
      fileHandleMock.readFile.mockRejectedValue(new Error());

      await expect(
        workflowExecutionOutputDaoImpl.getOutput(path),
      ).rejects.toThrow(StepOutputDaoException);
    });

    it('should not throw an error if the file cannot be closed', async () => {
      const path = 'path';

      fsOpenSpy.mockResolvedValue(fileHandleMock);
      fileHandleMock.readFile.mockResolvedValue(
        workflowExecutionStepOutputExample,
      );
      fileHandleMock.close.mockRejectedValue(new Error());

      await expect(() =>
        workflowExecutionOutputDaoImpl.getOutput(path),
      ).not.toThrow();
    });
  });
});
