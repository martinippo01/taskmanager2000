import { HttpException, HttpStatus } from '@nestjs/common';

abstract class OrquestadorException extends HttpException {
  private readonly _name: string;
  private readonly _message: string;
  private readonly _statusCode: HttpStatus;

  protected constructor(name: string, message: string, statusCode: number) {
    super(message, statusCode);
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

  getStatusCode(): number {
    return this._statusCode;
  }
}

export default OrquestadorException;
