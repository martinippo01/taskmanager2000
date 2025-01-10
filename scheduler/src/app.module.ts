import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
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
  ],
  controllers: [WorkflowExecutionStepController],
  providers: [
    {
      provide: TaskAgentsGateway,
      useClass: TaskAgentsGatewayImpl,
    },
    {
      provide: TaskAgentGatewayProvider,
      useClass: TaskAgentGatewayProviderImpl,
    },
  ],
})
export class AppModule {}
