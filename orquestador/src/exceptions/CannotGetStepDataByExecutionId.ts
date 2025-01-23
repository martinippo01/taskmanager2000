import { HttpStatus } from '@nestjs/common';
import OrquestadorException from './OrquestadorException';

class CannotGetStepDataByExecutionId extends OrquestadorException {
  private static readonly NAME = 'WorkflowNotFoundException';

  constructor(readonly message: string) {
    super(CannotGetStepDataByExecutionId.NAME, message, HttpStatus.NOT_FOUND);
  }
}

export default CannotGetStepDataByExecutionId;
