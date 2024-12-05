import {
  KafkaClient,
  kafkaClientFactoryProvider,
} from 'src/configs/KafkaConfig';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { WorkflowExecutionRequestController } from '@controllers/WorkflowExecutionRequestController';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowExecutionDaoImpl } from '@repositories/WorkflowExecutionDaoImpl';
import { WorkflowExecutionDao } from '@interfaces/repository/WorkflowExecutionDao';

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
  controllers: [WorkflowExecutionRequestController],
  providers: [
    { provide: WorkflowExecutionDao, useClass: WorkflowExecutionDaoImpl },
  ],
})
export class AppModule {}
