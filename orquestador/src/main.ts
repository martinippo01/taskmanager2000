import OTelSDK from '@shared/Tracing';
import OtelLogger from '@shared/OtelLogger';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getKafkaStepScheduleRequestConfig } from '@configs/KafkaStepScheduleRequestConfig';
import { getKafkaStepExecutionResponseConfig } from '@configs/KafkaStepExecutionResponseConfig';

async function bootstrap() {
  // Start the OpenTelemetry SDK
  const serviceName = process.env.SERVICE_NAME!;
  const loggerUrl = process.env.LOGGER_URL!;
  const traceUrl = process.env.TRACE_URL!;
  const otelSdk = new OTelSDK(serviceName, loggerUrl, traceUrl);
  await otelSdk.start();

  // Create the NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new OtelLogger(otelSdk),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      forbidUnknownValues: true,
      whitelist: true,
      transform: true,
    }),
  );

  // Workflow Execution Request Kafka Microservice
  //const brokersWorkflow = process.env.KAFKA_BROKERS_WER?.split(',');
  //app.connectMicroservice<MicroserviceOptions>(
  //  getKafkaWorkflowExecutionRequestConfig({
  //    brokers: brokersWorkflow,
  //    clientId: process.env.KAFKA_CLIENT_ID_WER,
  //    username: process.env.KAFKA_USERNAME_WER,
  //    password: process.env.KAFKA_PASSWORD_WER,
  //    groupId: process.env.KAFKA_GROUP_ID_WER,
  //  }),
  //  { inheritAppConfig: true },
  //);

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

  const consumerStep = process.env.KAFKA_BROKERS_SER?.split(',');
  app.connectMicroservice<MicroserviceOptions>(
    getKafkaStepExecutionResponseConfig({
      brokers: consumerStep,
      clientId: process.env.KAFKA_CLIENT_ID_SER,
      groupId: process.env.KAFKA_GROUP_ID_SER,
      username: process.env.KAFKA_USERNAME_SER,
      password: process.env.KAFKA_PASSWORD_SER,
    }),
    { inheritAppConfig: true },
  );

  //  const consumerError = process.env.KAFKA_BROKERS_SEE?.split(',');
  //  app.connectMicroservice<MicroserviceOptions>(
  //    getKafkaStepExecutionErrorConfig({
  //      brokers: consumerError,
  //      clientId: process.env.KAFKA_CLIENT_ID_SEE,
  //      groupId: process.env.KAFKA_GROUP_ID_SEE,
  //      username: process.env.KAFKA_USERNAME_SEE,
  //      password: process.env.KAFKA_PASSWORD_SEE,
  //    }),
  //    { inheritAppConfig: true },
  //  );

  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT environment variable not set');
  }
  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
