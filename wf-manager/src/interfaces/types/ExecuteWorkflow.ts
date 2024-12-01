import {
  IsOptional,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

function IsInputArgs(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsInputArgs',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            typeof value === 'object' &&
            value !== null &&
            Object.keys(value).every((key) => typeof key === 'string') &&
            Object.values(value).every(
              (value) => typeof value === 'string' || Array.isArray(value),
            )
          );
        },
      },
    });
  };
}

export class ExecuteWorkflowRequestDto {
  @IsOptional()
  @IsInputArgs({
    message: 'Input arguments must be a record of strings or string arrays',
  })
  inputArgs?: Record<string, string | string[]>;
}

export type ExecuteWorkflowResponseDto = {
  queued: boolean; // Indicates the workflow was queued to execute
  executionId: string; // The execution ID of the workflow
};
