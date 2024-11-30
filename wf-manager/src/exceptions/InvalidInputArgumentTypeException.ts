import { HttpStatus } from '@nestjs/common';
import WorkflowException from './WorkflowException';

class InvalidInputArgumentTypeException extends WorkflowException {
  private static readonly NAME = 'InvalidInputArgumentTypeException';

  constructor(argument: string, type: string) {
    super(
      InvalidInputArgumentTypeException.NAME,
      `Input argument '${argument}' does not match with the input parameter type '${type}'`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export default InvalidInputArgumentTypeException;
