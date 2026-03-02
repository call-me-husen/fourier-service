import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  });

  const reflector = app.get(Reflector);

  app.setGlobalPrefix('api');

  // Global validation pipe to validate incoming requests
  // whitelist: true - strips properties that do not have any decorators
  // transform: true - transforms payloads to be objects typed according to their DTO classes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Centralised response shape: { code, message, data }
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  // Centralised error shape: { code, message }
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 4000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
