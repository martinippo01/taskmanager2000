abstract class WorkflowError extends Error {
  private readonly _name: string;
  private readonly _message: string;

  protected constructor(name: string, message: string) {
    super(message);
    this._name = name;
    this._message = message;
  }

  get name(): string {
    return this._name;
  }

  get message(): string {
    return this._message;
  }
}

export default WorkflowError;
