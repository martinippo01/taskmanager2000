import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionFilter<TException>
  implements ExceptionFilter<TException>
{
  protected readonly LOGGER = new Logger(AllExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  getExceptionName(exception: TException): string {
    return exception instanceof Error ? exception.name : 'UnknownException';
  }

  getExceptionMessage(exception: TException): string {
    return exception instanceof Error
      ? exception.message
      : 'Internal Server Error';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getExceptionHttpStatus(_exception: TException): number {
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  getHttpBody(exception: TException): object {
    const message = this.getExceptionMessage(exception);
    return {
      statusCode: this.getExceptionHttpStatus(exception),
      error: message,
    };
  }

  catch(exception: TException, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();

      const name = this.getExceptionName(exception);
      const message = this.getExceptionMessage(exception);
      this.LOGGER.error(`${name}: ${message}`);

      const body = this.getHttpBody(exception);
      const httpStatus = this.getExceptionHttpStatus(exception);
      const path = httpAdapter.getRequestUrl(ctx.getRequest());
      const responseBody = {
        ...body,
        path,
      };
      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
  }
}
