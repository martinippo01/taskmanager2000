import {
  KafkaWorkflowExecutionRequestClient,
  kafkaWorkflowExecutionRequestClientFactoryProvider,
} from '@configs/KafkaWorkflowExecutionRequestConfig';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { WorkflowExecutionRequestController } from '@controllers/WorkflowExecutionRequestController';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowExecutionDaoImpl } from '@repositories/WorkflowExecutionDaoImpl';
import { WorkflowExecutionDao } from '@interfaces/repository/WorkflowExecutionDao';
import { WorkflowExecutionStepResponseController } from '@controllers/WorkflowExecutionStepResponseController';
import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestClientFactoryProvider,
} from '@configs/KafkaStepScheduleRequestConfig';
import { StepScheduleRequestGateway } from '@interfaces/gateways/StepScheduleRequestGateway';
import { StepScheduleRequestGatewayImpl } from '@gateways/StepScheduleRequestGatewayImpl';
import { WorkflowExecutionStepDomain } from '@interfaces/domains/WorkflowExecutionStepDomain';
import { WorkflowExecutionStepDomainImpl } from '@domains/WorkflowExecutionStepDomainImpl';
import { WorkflowExecutionDomainImpl } from '@domains/WorkflowExecutionDomainImpl';
import { WorkflowExecutionDomain } from '@interfaces/domains/WorkflowExecutionDomain';

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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'default_user',
      password: process.env.DB_PASSWORD || 'default_password',
      database: process.env.DB_NAME || 'default_db',
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNC === 'true', // Set false in production
    }),
  ],
  controllers: [
    WorkflowExecutionRequestController,
    WorkflowExecutionStepResponseController,
  ],
  providers: [
    {
      provide: WorkflowExecutionStepDomain,
      useClass: WorkflowExecutionStepDomainImpl,
    },
    { provide: WorkflowExecutionDomain, useClass: WorkflowExecutionDomainImpl },
    { provide: WorkflowExecutionDao, useClass: WorkflowExecutionDaoImpl },
    {
      provide: StepScheduleRequestGateway,
      useClass: StepScheduleRequestGatewayImpl,
    },
  ],
})
export class AppModule {}
