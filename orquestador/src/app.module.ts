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
import { StepExecutionResponseController } from '@controllers/StepExecutionResponseController';
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
import { ConfigModuleValidationSchema } from '@configs/ConfigValidationSchema';
import { WorkflowExecutionOutputDomain } from '@interfaces/domains/WorkflowExecutionOutputDomain';
import WorkflowExecutionOutputDomainImpl from '@domains/WorkflowExecutionOutputDomainImpl';
import { WorkflowExecutionOutputDao } from '@interfaces/repository/WorkflowExecutionOutputDao';
import WorkflowExecutionOutputDaoImpl from '@repositories/WorkflowExecutionOutputDaoImpl';
import { WorkflowExecution } from '@repositories/entities/worflow-execution.entity';
import {
  KafkaStepExecutionResponseClient,
  KafkaStepExecutionResponseClientFactoryProvider,
} from '@configs/KafkaStepExecutionResponseConfig';
import PingController from '@controllers/PingController';
import { HealthCheckDomainImpl } from '@domains/HealthCheckDomainImpl';
import { HealthCheckDomain } from '@interfaces/domains/HealthCheckDomain';

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
        name: KafkaWorkflowExecutionRequestClient,
        useFactory: kafkaWorkflowExecutionRequestClientFactoryProvider,
      },
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: KafkaStepScheduleRequestClient,
        useFactory: KafkaStepScheduleRequestClientFactoryProvider,
      },
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: KafkaStepExecutionResponseClient,
        useFactory: KafkaStepExecutionResponseClientFactoryProvider,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'wf-execution-db',
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNC === 'true', // Set false in production
    }),
    TypeOrmModule.forFeature([WorkflowExecution]),
  ],
  controllers: [
    WorkflowExecutionRequestController,
    StepExecutionResponseController,
    PingController,
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
    {
      provide: WorkflowExecutionOutputDomain,
      useClass: WorkflowExecutionOutputDomainImpl,
    },
    {
      provide: WorkflowExecutionOutputDao,
      useClass: WorkflowExecutionOutputDaoImpl,
    },
    {
      provide: HealthCheckDomain,
      useClass: HealthCheckDomainImpl,
    },
  ],
  exports: [WorkflowExecutionDao],
})
export class AppModule {}
