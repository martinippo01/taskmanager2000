import { Workflow } from '@interfaces/types/Workflow';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { Inject, Injectable, Logger } from '@nestjs/common';
import InvalidInputArgumentTypeException from '@exceptions/InvalidInputArgumentTypeException';
import InputArgumentMismatchException from '@exceptions/InputArgumentMismatchException';
import InputParamUnsetException from '@exceptions/InputParamsUnsetException';
import {
  getInputArgumentFromParamType,
  InputArguments,
} from '@shared/WorkflowInput';
import { TracerGateway } from '@shared/TracerGateway';

@Injectable()
class WorkflowInputDomainImpl implements WorkflowInputDomain {
  private readonly LOGGER = new Logger(WorkflowInputDomainImpl.name);

  constructor(
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  getInputArgs(
    workflow: Workflow,
    inputArgs: Record<string, string | string[]>,
  ): InputArguments {
    return this.tracerGateway.trace(
      'WorkflowInputDomainImpl.getInputArgs',
      (span) => {
        span.setAttribute('workflow.name', workflow.name);
        span.setAttribute('workflow.inputArgs', JSON.stringify(inputArgs));
        this.LOGGER.debug(
          `Getting input arguments for workflow ${workflow.name}`,
        );
        const inputParams = workflow.inputParams;
        const inputArguments: InputArguments = {};

        const setInputParams: Set<string> = new Set<string>();
        const allInputParams: string[] = Object.keys(inputParams);

        this.LOGGER.debug('Validating input arguments');
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
        this.LOGGER.debug('Validating all input parameters are set');
        this.LOGGER.debug(
          `Set input parameters: json ${JSON.stringify(setInputParams)}, size: ${setInputParams.size}`,
        );
        this.LOGGER.debug(
          `All input parameters: ${allInputParams}. length: ${allInputParams.length}`,
        );
        // Creo que esto no tiene sentido
        if (setInputParams.size !== allInputParams.length) {
          const missingInputParams = allInputParams.filter(
            (param) => !setInputParams.has(param),
          );
          throw new InputParamUnsetException(missingInputParams);
        }
        span.setAttribute('workflow.inputArguments.validated', true);
        span.setAttribute(
          'workflow.inputArguments.validated.arguments',
          JSON.stringify(inputArguments),
        );

        return inputArguments;
      },
    ) as InputArguments;
  }
}

export default WorkflowInputDomainImpl;
