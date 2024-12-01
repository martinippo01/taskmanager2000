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

  catchHttp(exception: TException): {
    body: object;
    httpStatus: number;
  } {
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    let name: string;
    let message: string;
    if (exception instanceof Error) {
      name = exception.name;
      message = exception.message;
    } else {
      name = 'UnknownException';
      message = 'Internal Server Error';
    }
    this.LOGGER.error(`${name}: ${message}`);
    return {
      body: {
        statusCode: status,
        error: message,
      },
      httpStatus: status,
    };
  }

  catch(exception: TException, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();
      const { body, httpStatus } = this.catchHttp(exception);
      const path = httpAdapter.getRequestUrl(ctx.getRequest());
      const responseBody = {
        ...body,
        path,
      };
      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
  }
}
