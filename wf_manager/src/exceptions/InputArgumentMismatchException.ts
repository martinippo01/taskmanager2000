import { HttpStatus } from '@nestjs/common';
import WorkflowException from './WorkflowException';

class InputArgumentMismatchException extends WorkflowException {
  private static readonly NAME = 'InputArgumentMismatchException';

  constructor(argument: string) {
    super(
      InputArgumentMismatchException.NAME,
      `Input argument '${argument}' does not match with any of the input parameters`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export default InputArgumentMismatchException;
