import { Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { AllExceptionFilter } from './AllExceptionFilter';
import { HttpAdapterHost } from '@nestjs/core';

@Catch(HttpException)
export class HttpExceptionFilter<
    TException extends HttpException = HttpException,
  >
  extends AllExceptionFilter<TException>
  implements ExceptionFilter<TException>
{
  protected readonly LOGGER: Logger = new Logger(HttpExceptionFilter.name);

  constructor(httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost);
  }

  getExceptionName(exception: TException): string {
    return exception.name;
  }

  getExceptionMessage(exception: TException): string {
    const response = exception.getResponse();
    return typeof response === 'string' ? response : JSON.stringify(response);
  }

  getHttpBody(exception: TException): object {
    const response = exception.getResponse();
    const messageObj =
      typeof response === 'string' ? { message: response } : response;
    return messageObj;
  }

  getExceptionHttpStatus(exception: TException): number {
    return exception.getStatus();
  }
}
