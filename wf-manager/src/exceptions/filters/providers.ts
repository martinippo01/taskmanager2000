import { Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionFilter } from './AllExceptionFilter';
import { HttpExceptionFilter } from './HttpExceptionFilter';
import { WorkflowExceptionFilter } from './WorkflowExceptionFilter';

export const exceptionFilterProviders: Provider[] = [
  {
    provide: APP_FILTER,
    useClass: AllExceptionFilter,
  },
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
  {
    provide: APP_FILTER,
    useClass: WorkflowExceptionFilter,
  },
];
