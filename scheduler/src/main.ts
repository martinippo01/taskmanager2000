import OTelSDK from '@shared/Tracing';
import OtelLogger from '@shared/OtelLogger';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getKafkaStepScheduleRequestConfig } from './configs/KafkaStepScheduleRequestConfig';

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

  // Step Execution Request Kafka Microservice Consumer
  const brokersSsr = process.env.KAFKA_BROKERS_SSR?.split(',');
  app.connectMicroservice<MicroserviceOptions>(
    getKafkaStepScheduleRequestConfig({
      brokers: brokersSsr,
      clientId: process.env.KAFKA_CLIENT_ID_SSR,
      groupId: process.env.KAFKA_GROUP_ID_SSR,
      username: process.env.KAFKA_USERNAME_SSR,
      password: process.env.KAFKA_PASSWORD_SSR,
    }),
    { inheritAppConfig: true },
  );

  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT environment variable is required');
  }
  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
