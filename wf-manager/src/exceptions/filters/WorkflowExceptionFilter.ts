import WorkflowException from '@exceptions/WorkflowException';
import { Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './HttpExceptionFilter';

@Catch(WorkflowException)
export class WorkflowExceptionFilter
  extends HttpExceptionFilter<WorkflowException>
  implements ExceptionFilter<WorkflowException>
{
  protected readonly LOGGER: Logger = new Logger(WorkflowExceptionFilter.name);

  getExceptionMessage(exception: WorkflowException): string {
    return exception.getMessage();
  }

  getExceptionName(exception: WorkflowException): string {
    return exception.getName();
  }

  getHttpBody(exception: WorkflowException): object {
    const message = this.getExceptionMessage(exception);
    return {
      statusCode: exception.getStatus(),
      error: message,
    };
  }
}
