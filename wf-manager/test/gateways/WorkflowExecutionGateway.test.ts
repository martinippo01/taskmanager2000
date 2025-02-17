import WorkflowExecutionGatewayImpl from '@gateways/WorkflowExecutionGatewayImpl';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import { Workflow } from '@interfaces/types/Workflow';
import { WorkflowExecutionRequestProducer } from '@interfaces/types/WorkflowExecutionRequestProducer';
import { InternalServerErrorException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';
import { InputArguments } from '@shared/WorkflowInput';

describe('WorkflowExecutionGateway', () => {
  class WorkflowExecutionRequestProducerMock
    implements WorkflowExecutionRequestProducer
  {
    async connect() {
      return;
    }

    async disconnect() {
      return;
    }

    async send(): Promise<string> {
      return 'executionId';
    }

    isConnected(): boolean {
      return true;
    }
  }

  let gateway: WorkflowExecutionGatewayImpl;
  let producer: WorkflowExecutionRequestProducer;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: WorkflowExecutionGateway,
          useClass: WorkflowExecutionGatewayImpl,
        },
        {
          provide: WorkflowExecutionRequestProducer,
          useClass: WorkflowExecutionRequestProducerMock,
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    moduleRef.useLogger(false);
    gateway = moduleRef.get(WorkflowExecutionGateway);
    producer = moduleRef.get(WorkflowExecutionRequestProducer);
  });

  describe('connect', () => {
    it('should connect producer', async () => {
      const mock = jest.spyOn(producer, 'connect');
      mock.mockImplementation(() => Promise.resolve());
      await gateway.onModuleInit();
      expect(mock).toHaveBeenCalled();
    });

    it('should throw an error if failed to connect producer', async () => {
      const mock = jest.spyOn(producer, 'connect');
      mock.mockImplementation(() => Promise.reject(new Error()));
      await expect(gateway.onModuleInit()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect producer', async () => {
      const mock = jest.spyOn(producer, 'disconnect');
      mock.mockImplementation(() => Promise.resolve());
      await gateway.onModuleDestroy();
      expect(mock).toHaveBeenCalled();
    });

    it('should throw an error if failed to disconnect producer', async () => {
      const mock = jest.spyOn(producer, 'disconnect');
      mock.mockImplementation(() => Promise.reject(new Error()));
      await expect(gateway.onModuleDestroy()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('queueWorkflow', () => {
    const workflowExample: Workflow = {
      version: '0.0',
      name: 'Test Plan',
      description: 'A description of the test plan',
      inputParams: {
        param1: 'string',
        param2: 'number',
        param3: 'boolean',
        param4: 'string[]',
      },
      plan: { steps: [] },
      enabled: true,
    };

    const inputArgsExample: InputArguments = {
      param1: 'test',
      param2: '123',
      param3: 'true',
      param4: ['a', 'b', 'c'],
    };

    it('should queue workflow for execution', async () => {
      const mock = jest.spyOn(producer, 'send');
      mock.mockImplementation(() => Promise.resolve('executionId'));
      const result = await gateway.queueWorkflow(
        workflowExample,
        inputArgsExample,
      );
      expect(result).toEqual('executionId');
      expect(mock).toHaveBeenCalled();
    });

    it('should throw an error if failed to queue workflow for execution', async () => {
      const mock = jest.spyOn(producer, 'send');
      mock.mockImplementation(() => Promise.reject(new Error()));
      await expect(
        gateway.queueWorkflow(workflowExample, inputArgsExample),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
