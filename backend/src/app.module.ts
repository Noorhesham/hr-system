import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { configValidationSchema } from './config/config.schema';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './core/redis/redis.module';
import { HashingModule } from './core/hashing/hashing.module';
import { MyLoggerModule } from './core/logger/my-logger.module';
import { CurrencyInterceptor } from './core/interceptors/currency.interceptor';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // ─── Config ────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),

    // ─── Infrastructure ────────────────────────────────────────────────────
    DatabaseModule,
    RedisModule,
    HashingModule,
    MyLoggerModule,

    // ─── Scheduling + Events ───────────────────────────────────────────────
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    // ─── Rate limiting (global: 100 req/60s) ──────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ─── Feature modules ───────────────────────────────────────────────────
    AuthModule,
  ],
  providers: [
    // CurrencyInterceptor runs on EVERY response (converts cents → target currency)
    {
      provide: APP_INTERCEPTOR,
      useClass: CurrencyInterceptor,
    },
    // ThrottlerGuard runs globally on EVERY endpoint
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
