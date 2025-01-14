import { HttpException } from '@nestjs/common';

abstract class TaskServiceException extends HttpException {
  private readonly _name: string;
  private readonly _message: string;
  private readonly _statusCode: number;

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

export default TaskServiceException;
