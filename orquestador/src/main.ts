import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '@configs/KafkaConfig';

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

  const brokers = process.env.KAFKA_BROKERS?.split(',');
  app.connectMicroservice<MicroserviceOptions>(
    getKafkaConfig({
      brokers,
      clientId: process.env.KAFKA_CLIENT_ID,
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
      groupId: process.env.KAFKA_GROUP_ID,
    }),
  );

  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT environment variable not set');
  }
  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
