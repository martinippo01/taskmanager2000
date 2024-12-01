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

  catchHttp(exception: TException): { body: object; httpStatus: number } {
    const status = exception.getStatus();
    const message = exception.getResponse();
    const name = exception.name;

    const messageStr =
      typeof message === 'string' ? message : JSON.stringify(message);

    this.LOGGER.error(`${name}: ${messageStr}`);

    const messageObj = typeof message === 'string' ? { message } : message;

    return {
      body: messageObj,
      httpStatus: status,
    };
  }
}
