import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { ConfigModule } from '@nestjs/config';
import { exceptionFilterProviders } from '@exceptions/filters/providers';
import { HealthCheckDomainImpl } from '@domains/HealthCheckImpl';
import PingController from '@controllers/PingController';
import { ConfigModuleValidationSchema } from './configs/ConfigValidationSchema';
import { tracerGatewayProvider } from '@shared/TracerGateway';
import TracingMiddleware from '@shared/TracingMiddleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: ConfigModuleValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
  controllers: [WorkflowControllerRestImpl, PingController],
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
    {
      provide: HealthCheckDomain,
      useClass: HealthCheckDomainImpl,
    },
    tracerGatewayProvider,
    redisClientFactory,
    ...exceptionFilterProviders,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes('*');
  }
}
