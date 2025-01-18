import { Module } from '@nestjs/common';
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
    ]),
    HttpModule,
  ],
  controllers: [WorkflowExecutionStepController],
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
  ],
})
export class AppModule {}
