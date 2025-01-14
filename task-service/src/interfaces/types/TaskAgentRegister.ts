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

export class TaskAgentRegisterRequestDto {
  @IsKafkaData()
  kafkaData: KafkaTaskData;

  @IsInputParams()
  params: InputParams;

  @IsOptional()
  @IsArray()
  optionalParams?: string[];
}

export class TaskAgentRegisterResponseDto {
  registered: boolean;
}
