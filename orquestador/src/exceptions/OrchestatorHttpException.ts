import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

abstract class OrchestatorHttpException extends HttpException {
  private readonly _name: string;
  private readonly _message: string;
  private readonly _statusCode: HttpStatus;

  protected constructor(
    name: string,
    message: string,
    statusCode: HttpStatus,
    options?: HttpExceptionOptions,
  ) {
    super(message, statusCode, options);
    this._name = name;
    this._message = message;
    this._statusCode = statusCode;
  }

  getName(): string {
    return this._name;
  }

  getMessage(): string {
    return this._message;
  }

  getStatusCode(): HttpStatus {
    return this._statusCode;
  }
}

export default OrchestatorHttpException;
