import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as express from 'express';
import { TranslationInterceptor } from './common/interceptors/translation.interceptor';
import { DecimalInterceptor } from './common/interceptors/decimal.interceptor';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { MyLoggerService } from './core/logger/my-logger.service';
import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApiConfig } from './openapi.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // needed for webhook HMAC verification
    bodyParser: false,
  });

  app.setGlobalPrefix('api');

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
      /\.vercel\.app$/,
      ...(isDev
        ? [
            'http://localhost:3000',
            'http://localhost:3002',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3002',
            /https:\/\/.*\.ngrok-free\.app$/,
          ]
        : []),
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

  // Order matters: DecimalInterceptor is registered LAST so it runs FIRST on the
  // response — converting Decimals to numbers BEFORE TranslationInterceptor
  // rebuilds the object (which would otherwise flatten Decimals to {s,e,d}).
  app.useGlobalInterceptors(
    new TranslationInterceptor(),
    new DecimalInterceptor(),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── OpenAPI / Swagger ────────────────────────────────────────────────────
  // UI at /docs, machine-readable spec at /docs-json (import this into APIDog).
  const openApiDoc = SwaggerModule.createDocument(app, buildOpenApiConfig());
  SwaggerModule.setup('docs', app, openApiDoc);

  const logger = await app.resolve(MyLoggerService);
  app.useLogger(logger);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
