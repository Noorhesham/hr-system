import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as express from 'express';
import { TranslationInterceptor } from './common/interceptors/translation.interceptor';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { MyLoggerService } from './core/logger/my-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // needed for webhook HMAC verification
    bodyParser: false,
  });

  // ─── Body parsers (custom — needed for rawBody capture) ───────────────────
  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ─── Security ─────────────────────────────────────────────────────────────
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ─── CORS ──────────────────────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      ...(isDev ? [/https:\/\/.*\.ngrok-free\.app$/] : []),
    ],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-language',
      'x-currency',
      'x-skip-translation',
      'x-session-id',
      'x-guest-id',
    ],
  });

  // ─── Global pipes / interceptors / filters ────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        // Map class-validator errors to fieldErrors: { field: message }
        const fieldErrors: Record<string, string> = {};
        errors.forEach((err) => {
          fieldErrors[err.property] = Object.values(err.constraints || {})[0];
        });
        return new BadRequestException({
          message: 'Validation failed',
          fieldErrors,
        });
      },
    }),
  );

  app.useGlobalInterceptors(new TranslationInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const logger = app.get(MyLoggerService);
  app.useLogger(logger);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
