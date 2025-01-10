import { RpcException } from '@nestjs/microservices';

abstract class OrchestatorRpcException extends RpcException {
  private readonly _name: string;
  private readonly _message: string;

  protected constructor(name: string, message: string) {
    super(message);
    this._name = name;
    this._message = message;
  }

  getName(): string {
    return this._name;
  }

  getMessage(): string {
    return this._message;
  }
}

export default OrchestatorRpcException;
