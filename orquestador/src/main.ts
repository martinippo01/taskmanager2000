import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getKafkaWorkflowExecutionRequestConfig } from '@configs/KafkaWorkflowExecutionRequestConfig';
import { getKafkaStepScheduleRequestConfig } from '@configs/KafkaStepScheduleRequestConfig';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      forbidUnknownValues: true,
      whitelist: true,
      transform: true,
    }),
  );

  // Workflow Execution Request Kafka Microservice
  const brokersWorkflow = process.env.KAFKA_BROKERS_WER?.split(',');
  app.connectMicroservice<MicroserviceOptions>(
    getKafkaWorkflowExecutionRequestConfig({
      brokers: brokersWorkflow,
      clientId: process.env.KAFKA_CLIENT_ID_WER,
      username: process.env.KAFKA_USERNAME_WER,
      password: process.env.KAFKA_PASSWORD_WER,
      groupId: process.env.KAFKA_GROUP_ID_WER,
    }),
    { inheritAppConfig: true },
  );

  // Step Execution Request Kafka Microservice
  const brokersStep = process.env.KAFKA_BROKERS_SSR?.split(',');
  app.connectMicroservice<MicroserviceOptions>(
    getKafkaStepScheduleRequestConfig({
      brokers: brokersStep,
      clientId: process.env.KAFKA_CLIENT_ID_SSR,
      username: process.env.KAFKA_USERNAME_SSR,
      password: process.env.KAFKA_PASSWORD_SSR,
    }),
    { inheritAppConfig: true },
  );

  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT environment variable not set');
  }
  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
