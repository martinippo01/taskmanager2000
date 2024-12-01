import WorkflowException from '@exceptions/WorkflowException';
import { Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './HttpExceptionFilter';

@Catch(WorkflowException)
export class WorkflowExceptionFilter
  extends HttpExceptionFilter<WorkflowException>
  implements ExceptionFilter<WorkflowException>
{
  protected readonly LOGGER: Logger = new Logger(WorkflowExceptionFilter.name);

  catchHttp(exception: WorkflowException): {
    body: object;
    httpStatus: number;
  } {
    const status = exception.getStatus();
    const message = exception.getMessage();
    const name = exception.getName();

    this.LOGGER.error(`${name}: ${message}`);

    return {
      body: {
        statusCode: status,
        error: message,
      },
      httpStatus: status,
    };
  }
}
