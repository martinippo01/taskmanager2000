import {
  KafkaClient,
  kafkaClientFactoryProvider,
} from 'src/configs/KafkaConfig';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { WorkflowExecutionRequestController } from '@controllers/WorkflowExecutionRequestController';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: KafkaClient,
        useFactory: kafkaClientFactoryProvider,
      },
    ]),
  ],
  controllers: [WorkflowExecutionRequestController],
  providers: [],
})
export class AppModule {}
