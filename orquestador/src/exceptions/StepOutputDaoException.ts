import { HttpStatus } from '@nestjs/common';
import OrchestatorHttpException from './OrchestatorHttpException';

class StepOutputDaoException extends OrchestatorHttpException {
  private static readonly NAME = 'StepOutputDaoException';

  constructor(message: string, cause?: unknown) {
    super(
      StepOutputDaoException.NAME,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      { cause },
    );
  }
}

export default StepOutputDaoException;
