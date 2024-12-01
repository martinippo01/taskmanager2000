import { Module } from '@nestjs/common';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import WorkflowControllerRestImpl from '@controllers/WorkflowControllerRestImpl';
import WorkflowDomainImpl from '@domains/WorkflowDomainImpl';
import WorkflowInputDomainImpl from '@domains/WorkflowInputDomainImpl';
import WorkflowPlanDomainImpl from '@domains/WorkflowPlanDomainImpl';
import WorkflowExecutionGatewayImpl from '@gateways/WorkflowExecutionGatewayImpl';
import WorkflowDaoImpl from '@repositories/WorkflowDaoImpl';
import {
  redisClientFactory,
  RedisRepositoryImpl,
} from '@repositories/RedisRepositoryImpl';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import { WorkflowExecutionRequestProducer } from '@interfaces/types/WorkflowExecutionRequestProducer';
import { WorkflowExecutionRequestProducer as WorkflowExecutionRequestProducerImpl } from '@shared/WorkflowExecutionRequest';
import { HealthCheckService } from '@domains/HealthCheckImpl';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { WorkflowExceptionFilter } from '@exceptions/filters/WorkflowExceptionFilter';
import { HttpExceptionFilter } from '@exceptions/filters/HttpExceptionFilter';
import { AllExceptionFilter } from '@exceptions/filters/AllExceptionFilter';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [WorkflowControllerRestImpl],
  providers: [
    {
      provide: WorkflowDomain,
      useClass: WorkflowDomainImpl,
    },
    {
      provide: WorkflowInputDomain,
      useClass: WorkflowInputDomainImpl,
    },
    {
      provide: WorkflowPlanDomain,
      useClass: WorkflowPlanDomainImpl,
    },
    {
      provide: WorkflowExecutionGateway,
      useClass: WorkflowExecutionGatewayImpl,
    },
    {
      provide: WorkflowDao,
      useClass: WorkflowDaoImpl,
    },
    {
      provide: RedisRepository,
      useClass: RedisRepositoryImpl,
    },
    {
      provide: WorkflowExecutionRequestProducer,
      useClass: WorkflowExecutionRequestProducerImpl,
    },
    redisClientFactory,
    HealthCheckService,
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
  ],
})
export class AppModule {}
