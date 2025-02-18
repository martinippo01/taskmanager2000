import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import { TaskServiceGatewayImpl } from './gateways/TaskServiceGatewayImpl';
import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestClientFactoryProvider,
} from './configs/KafkaStepScheduleRequestConfig';
import { ConfigModuleValidationSchema } from './configs/ConfigValidationSchema';

import { WorkflowExecutionStepController } from '@controllers/WorkflowExecutionStepController';
import { TaskAgentsGateway } from '@interfaces/gateways/TaskAgentsGateway';
import { TaskAgentsGatewayImpl } from '@gateways/TaskAgentsGatewayImpl';
import { TaskAgentGatewayProvider } from '@interfaces/gateways/TaskAgentGatewayProvider';
import { TaskAgentGatewayProviderImpl } from '@gateways/TaskAgentGatewayProvider';
import SchedulerDomainImpl from '@domains/SchedulerDomainImpl';
import { SchedulerDomain } from '@interfaces/domains/SchedulerDomain';
import { TaskServiceGateway } from '@interfaces/gateways/TaskServiceGateway';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { HealthCheckDomainImpl } from '@domains/HealthCheckDomainImpl';
import { StepScheduleExceptionOrchestratorGateway } from '@interfaces/gateways/StepScheduleExceptionOrchestratorGateway';
import { StepScheduleExceptionOrchestratorGatewayImpl } from '@gateways/StepScheduleExceptionOrchestatorGatewayImpl';
import {
  KafkaStepScheduleExceptionOrchestratorGatewayClient,
  KafkaStepScheduleExceptionOrchestratorGatewayClientFactoryProvider,
} from '@configs/KafkaStepScheduleExceptionOrchestratorGatewayConfig';
import PingController from '@controllers/PingController';
import TracingMiddleware from '@shared/TracingMiddleware';
import { tracerGatewayProvider } from '@shared/TracerGateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: ConfigModuleValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: KafkaStepScheduleRequestClient,
        useFactory: KafkaStepScheduleRequestClientFactoryProvider,
      },
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: KafkaStepScheduleExceptionOrchestratorGatewayClient,
        useFactory:
          KafkaStepScheduleExceptionOrchestratorGatewayClientFactoryProvider,
      },
    ]),
    HttpModule,
  ],
  controllers: [WorkflowExecutionStepController, PingController],
  providers: [
    {
      provide: SchedulerDomain,
      useClass: SchedulerDomainImpl,
    },
    {
      provide: TaskAgentsGateway,
      useClass: TaskAgentsGatewayImpl,
    },
    {
      provide: TaskAgentGatewayProvider,
      useClass: TaskAgentGatewayProviderImpl,
    },
    {
      provide: TaskServiceGateway,
      useClass: TaskServiceGatewayImpl,
    },
    {
      provide: HealthCheckDomain,
      useClass: HealthCheckDomainImpl,
    },
    {
      provide: StepScheduleExceptionOrchestratorGateway,
      useClass: StepScheduleExceptionOrchestratorGatewayImpl,
    },
    tracerGatewayProvider,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes('*');
  }
}
