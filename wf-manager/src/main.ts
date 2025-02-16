import OtelSDK from '@shared/Tracing';
import OtelLogger from '@shared/OtelLogger';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpStatus, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Start the OpenTelemetry SDK
  const serviceName = process.env.SERVICE_NAME!;
  const loggerUrl = process.env.LOGGER_URL!;
  const traceUrl = process.env.TRACE_URL!;
  const otelSdk = new OtelSDK(serviceName, loggerUrl, traceUrl);
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
  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT environment variable not set');
  }
  await app.listen(port);
}
bootstrap();
