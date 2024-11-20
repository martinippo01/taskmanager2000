import { HttpException, HttpStatus } from '@nestjs/common';

abstract class WorkflowException extends HttpException {
  private readonly _name: string;
  private readonly _message: string;
  private readonly _statusCode: HttpStatus;

  protected constructor(name: string, message: string, statusCode: number) {
    super(message, statusCode);
    this._name = name;
    this._message = message;
    this._statusCode = statusCode;
  }

  get name(): string {
    return this._name;
  }

  get message(): string {
    return this._message;
  }

  get statusCode(): number {
    return this._statusCode;
  }
}

export default WorkflowException;
