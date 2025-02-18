import { ConfigModuleValidationSchema } from '@configs/ConfigValidationSchema';
import PingController from '@controllers/PingController';
import TaskAgentController from '@controllers/TaskAgentController';
import HealthCheckDomainImpl from '@domains/HealthCheckDomainImpl';
import TaskServiceDomainImpl from '@domains/TaskServiceDomainImpl';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';
import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { TaskAgentDaoClient } from '@interfaces/repositories/TaskAgentDaoClient';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import TaskAgentDaoImpl from '@repositories/TaskAgentDaoImpl';
import { taskAgentDaoClientUseFactory } from '@repositories/TaskAgentDaoProvider';
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
  controllers: [TaskAgentController, PingController],
  providers: [
    {
      provide: TaskServiceDomain,
      useClass: TaskServiceDomainImpl,
    },
    {
      provide: TaskAgentDao,
      useClass: TaskAgentDaoImpl,
    },
    {
      provide: TaskAgentDaoClient,
      useFactory: taskAgentDaoClientUseFactory,
    },
    {
      provide: HealthCheckDomain,
      useClass: HealthCheckDomainImpl,
    },
    tracerGatewayProvider,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes('*');
  }
}
