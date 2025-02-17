import WorkflowInputDomainImpl from '@domains/WorkflowInputDomainImpl';
import InputArgumentMismatchException from '@exceptions/InputArgumentMismatchException';
import InputParamUnsetException from '@exceptions/InputParamsUnsetException';
import InvalidInputArgumentTypeException from '@exceptions/InvalidInputArgumentTypeException';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { Workflow } from '@interfaces/types/Workflow';
import { Test } from '@nestjs/testing';
import { tracerGatewayMockProvider } from '@shared/TracerGateway';
import { InputParams } from '@shared/WorkflowInput';

describe('WorkflowInputDomain', () => {
  let workflowInputDomain: WorkflowInputDomain;

  const getWorkflow = (inputParams: InputParams): Workflow => ({
    version: '0.0',
    name: 'test',
    description: 'test',
    inputParams,
    plan: { steps: [] },
    enabled: true,
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: WorkflowInputDomain,
          useClass: WorkflowInputDomainImpl,
        },
        tracerGatewayMockProvider,
      ],
    }).compile();

    workflowInputDomain = moduleRef.get(WorkflowInputDomain);
  });

  describe('getInputArgs', () => {
    it('should return input arguments', () => {
      const workflow = getWorkflow({
        param1: 'string',
        param2: 'number',
        param3: 'boolean',
      });
      const inputArgs: Record<string, string | string[]> = {
        param1: 'test',
        param2: '123',
        param3: 'true',
      };
      const result = workflowInputDomain.getInputArgs(workflow, inputArgs);
      expect(result).toEqual({
        param1: 'test',
        param2: 123,
        param3: true,
      });
    });

    it('should throw an error if input argument is not in input parameters', () => {
      const workflow = getWorkflow({
        param1: 'string',
      });
      const inputArgs = {
        param2: 'test',
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InputArgumentMismatchException);
    });

    it('should throw an error if input argument type does not match input parameter type', () => {
      const workflow = getWorkflow({
        param1: 'number',
      });
      const inputArgs = {
        param1: 'test',
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if not all input parameters are set', () => {
      const workflow = getWorkflow({
        param1: 'string',
        param2: 'number',
      });
      const inputArgs = {
        param1: 'test',
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InputParamUnsetException);
    });

    it('should return input arguments with array type', () => {
      const workflow = getWorkflow({
        param1: 'string',
        param2: 'number[]',
      });
      const inputArgs = {
        param1: 'test',
        param2: ['123', '456'],
      };
      const result = workflowInputDomain.getInputArgs(workflow, inputArgs);
      expect(result).toEqual({
        param1: 'test',
        param2: [123, 456],
      });
    });

    it('should throw an error if input argument type does not match array input parameter type', () => {
      const workflow = getWorkflow({
        param1: 'string',
        param2: 'number[]',
      });
      const inputArgs = {
        param1: 'test',
        param2: ['test'],
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if input argument is not an array', () => {
      const workflow = getWorkflow({
        param1: 'string[]',
      });
      const inputArgs = {
        param1: 'test',
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if input argument is not an array of the correct type', () => {
      const workflow = getWorkflow({
        param1: 'number[]',
      });
      const inputArgs = {
        param1: ['test', '123'],
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if input argument is not a number', () => {
      const workflow = getWorkflow({
        param1: 'number',
      });
      const inputArgs = {
        param1: 'test',
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if input argument is not a boolean', () => {
      const workflow = getWorkflow({
        param1: 'boolean',
      });
      const inputArgs = {
        param1: 'test',
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if input argument is not a valid number', () => {
      const workflow = getWorkflow({
        param1: 'number',
      });
      const inputArgs = {
        param1: '123.456.789',
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if input array parameter is not set', () => {
      const workflow = getWorkflow({
        param1: 'number[]',
      });
      const inputArgs = {};
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InputParamUnsetException);
    });

    it('should throw an error if input array argument is not an array', () => {
      const workflow = getWorkflow({
        param1: 'number[]',
      });
      const inputArgs = {
        param1: '123',
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if input array argument is not a valid number', () => {
      const workflow = getWorkflow({
        param1: 'number[]',
      });
      const inputArgs = {
        param1: ['123', '456', '789', 'abc'],
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });

    it('should throw an error if input array argument is not a boolean', () => {
      const workflow = getWorkflow({
        param1: 'boolean[]',
      });
      const inputArgs = {
        param1: ['true', 'abc', 'false'],
      };
      expect(() =>
        workflowInputDomain.getInputArgs(workflow, inputArgs),
      ).toThrow(InvalidInputArgumentTypeException);
    });
  });
});
