import { isKafkaTaskData, KafkaTaskData } from '@shared/TaskData';
import {
  InputParams,
  isInputParams as isInputParamsValidator,
} from '@shared/WorkflowInput';
import {
  IsArray,
  IsOptional,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

function IsKafkaData(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isKafkaData',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return isKafkaTaskData(value);
        },
      },
    });
  };
}

function IsInputParams(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isInputParams',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return isInputParamsValidator(value);
        },
      },
    });
  };
}

function isOptionalParams(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isOptionalParams',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const inputParams = (args.object as any)['params'];
          if (!isInputParamsValidator(inputParams)) {
            return true;
          }
          if (!Array.isArray(value)) {
            return false;
          }
          return value.every(
            (param) =>
              typeof param === 'string' && inputParams[param] !== undefined,
          );
        },
      },
    });
  };
}

export class TaskAgentRegisterRequestDto {
  @IsKafkaData({
    message:
      'Kafka data must be an object with the following properties: brokers, username, password, topic',
  })
  kafkaData: KafkaTaskData;

  @IsInputParams({
    message:
      'Input parameters must be a record of strings representing the parameter types (e.g., "string", "number", "boolean")',
  })
  params: InputParams;

  @IsOptional()
  @IsArray()
  @isOptionalParams({
    message:
      "Optional parameters must be an array containing a subset of the input parameters' keys",
  })
  optionalParams?: string[];
}

export class TaskAgentRegisterResponseDto {
  registered: boolean;
  updated: boolean;
}
