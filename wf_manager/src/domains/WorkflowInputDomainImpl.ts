import { Workflow } from '@interfaces/types/Workflow';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { Injectable } from '@nestjs/common';
import InvalidInputArgumentTypeException from '@exceptions/InvalidInputArgumentTypeException';
import {
  getInputArgumentFromParamType,
  InputArguments,
} from '@interfaces/types/WorkflowInput';
import InputArgumentMismatchException from '@exceptions/InputArgumentMismatchException';
import InputParamUnsetException from '@exceptions/InputParamsUnsetException';

@Injectable()
class WorkflowInputDomainImpl implements WorkflowInputDomain {
  getInputArgs(
    workflow: Workflow,
    inputArgs: Record<string, string | string[]>,
  ): InputArguments {
    const inputParams = workflow.inputParams;
    const inputArguments: InputArguments = {};

    const setInputParams: Set<string> = new Set<string>();
    const allInputParams: string[] = Object.keys(inputParams);

    for (const [key, value] of Object.entries(inputArgs)) {
      // Check if the input argument is in the input parameters
      if (!(key in inputParams)) {
        throw new InputArgumentMismatchException(key);
      }
      // Check if the input argument type matches the input parameter type
      const inputParamType = inputParams[key];
      const argument = getInputArgumentFromParamType(value, inputParamType);
      if (argument === null) {
        throw new InvalidInputArgumentTypeException(key, inputParamType);
      }
      inputArguments[key] = argument;
      setInputParams.add(key);
    }

    // Check if all input parameters are set
    if (setInputParams.size !== allInputParams.length) {
      const missingInputParams = allInputParams.filter(
        (param) => !setInputParams.has(param),
      );
      throw new InputParamUnsetException(missingInputParams);
    }

    return inputArguments;
  }
}

export default WorkflowInputDomainImpl;
