import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpStatus, ValidationPipe } from '@nestjs/common';

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
  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT environment variable not set');
  }
  await app.listen(port);
}
bootstrap();
