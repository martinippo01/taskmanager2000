import { HttpStatus } from '@nestjs/common';
import WorkflowException from './WorkflowException';

class InputParamUnsetException extends WorkflowException {
  private static readonly NAME = 'InputParamUnsetException';

  constructor(params: string[]) {
    super(
      InputParamUnsetException.NAME,
      `Input parameters [${params.join(', ')}] are unset`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export default InputParamUnsetException;
