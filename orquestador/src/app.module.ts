import {
  KafkaWorkflowExecutionRequestClient,
  kafkaWorkflowExecutionRequestClientFactoryProvider,
} from '@configs/KafkaWorkflowExecutionRequestConfig';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { WorkflowExecutionRequestController } from '@controllers/WorkflowExecutionRequestController';
import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestClientFactoryProvider,
} from '@configs/KafkaStepScheduleRequestConfig';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { StepScheduleRequestGatewayImpl } from '@gateways/StepScheduleRequestGatewayImpl';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: KafkaWorkflowExecutionRequestClient,
        useFactory: kafkaWorkflowExecutionRequestClientFactoryProvider,
      },
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: KafkaStepScheduleRequestClient,
        useFactory: KafkaStepScheduleRequestClientFactoryProvider,
      },
    ]),
  ],
  controllers: [WorkflowExecutionRequestController],
  providers: [
    {
      provide: StepScheduleRequestGateway,
      useClass: StepScheduleRequestGatewayImpl,
    },
  ],
})
export class AppModule {}
