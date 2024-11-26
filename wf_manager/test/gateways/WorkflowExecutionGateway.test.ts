import WorkflowExecutionGatewayImpl from '@gateways/WorkflowExecutionGatewayImpl';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import { WorkflowExecutionRequestProducer } from '@interfaces/types/WorkflowExecutionRequestProducer';
import { InternalServerErrorException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

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
  }

  let gateway: WorkflowExecutionGatewayImpl;
  let producer: WorkflowExecutionRequestProducerMock;

  beforeEach(async () => {
    producer = new WorkflowExecutionRequestProducerMock();
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: WorkflowExecutionGateway,
          useValue: new WorkflowExecutionGatewayImpl(producer),
        },
      ],
    }).compile();

    moduleRef.useLogger(false);
    gateway = moduleRef.get(WorkflowExecutionGateway);
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
});
