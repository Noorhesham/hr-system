# Backend Architecture Reference

**Stack:** NestJS 11 · Prisma ORM · PostgreSQL · Redis (ioredis) · TypeScript  
**Purpose:** Reusable system-design reference — drop into any new backend project and instruct Claude to follow these patterns.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Bootstrap & main.ts](#2-bootstrap--maints)
3. [App Module](#3-app-module)
4. [Database (Prisma + PostgreSQL)](#4-database-prisma--postgresql)
5. [Redis Module](#5-redis-module)
6. [Authentication System](#6-authentication-system)
7. [Guards & Decorators](#7-guards--decorators)
8. [Interceptors](#8-interceptors)
9. [Error Handling](#9-error-handling)
10. [Validation & DTOs](#10-validation--dtos)
11. [Pagination](#11-pagination)
12. [Multilingual (i18n)](#12-multilingual-i18n)
13. [Currency Handling](#13-currency-handling)
14. [Rate Limiting](#14-rate-limiting)
15. [Event-Driven Architecture](#15-event-driven-architecture)
16. [Cart & Inventory Pattern](#16-cart--inventory-pattern)
17. [Checkout & Payment Pattern](#17-checkout--payment-pattern)
18. [Notifications (FCM + In-App)](#18-notifications-fcm--in-app)
19. [File Uploads (Cloudinary)](#19-file-uploads-cloudinary)
20. [Email Service](#20-email-service)
21. [Webhook Idempotency Pattern](#21-webhook-idempotency-pattern)
22. [Soft Deletes](#22-soft-deletes)
23. [Module Template](#23-module-template)
24. [Environment Variables](#24-environment-variables)
25. [Security Checklist](#25-security-checklist)

---

## 1. Project Structure

```
src/
├── main.ts                          # Bootstrap, global pipes/interceptors/filters
├── app.module.ts                    # Root module — imports all feature modules
├── all-exceptions.filter.ts         # Global exception filter
│
├── common/                          # Shared across all modules
│   ├── decorators/
│   │   ├── get-user.decorator.ts    # @GetUser() — extracts req.user
│   │   └── roles.decorator.ts       # @Roles(...) — metadata for RolesGuard
│   ├── dto/
│   │   └── multilingual.dto.ts      # MultilingualDto — { en, ar } + toJson()
│   ├── guards/
│   │   └── roles.guard.ts           # RolesGuard — reads @Roles metadata
│   ├── interceptors/
│   │   └── translation.interceptor.ts  # Flattens { ar, en } → string
│   └── pagination/
│       ├── page-options.dto.ts       # page, limit, order, orderBy, search
│       ├── page-meta.dto.ts          # Computed meta (pageCount, hasNext, hasPrev)
│       └── page.dto.ts              # PageDto<T> — wraps data[] + meta
│
├── core/                            # Infrastructure (global providers)
│   ├── redis/
│   │   └── redis.module.ts          # @Global() Redis module with ioredis
│   ├── hashing/
│   │   └── hashing.service.ts       # @Global() bcrypt wrapper
│   ├── interceptors/
│   │   └── currency.interceptor.ts  # APP_INTERCEPTOR — cents → target currency
│   └── logger/
│       └── my-logger.service.ts     # Custom NestJS logger
│
├── config/                          # ConfigModule schema (Joi validation)
│   └── config.schema.ts
│
├── database/
│   └── database.service.ts          # PrismaClient with PrismaPg adapter
│
└── modules/
    ├── auth/                        # Auth module (JWT, refresh, OAuth, 2FA)
    ├── users/                       # User CRUD + admin management
    ├── products/                    # Products, variants, storefront, CSV import
    ├── categories/                  # Hierarchical categories with mega-menu cache
    ├── brands/
    ├── attributes/                  # GlobalAttribute + AttributeOption
    ├── cart/                        # Redis cart + DB sync + hydration
    ├── checkout/                    # Intent, locks, order creation
    ├── orders/                      # Order lifecycle + returns
    ├── payment/                     # Strategy pattern (Stripe, Kashier, COD)
    ├── webhook/                     # Idempotent webhook handling
    ├── notifications/               # In-app + FCM push
    ├── wishlist/                    # Wishlist + event listeners
    ├── flash-sales/                 # Flash sale items with stock limits
    ├── promo-codes/                 # Discount codes
    ├── shipping/                    # Shipping methods + rates
    ├── inventory/                   # Stock lock service
    ├── currency/                    # Exchange rate cron
    ├── media/                       # Cloudinary upload service
    ├── home/                        # Cached home page aggregation
    ├── settings/                    # App-level key-value settings
    ├── dashboard/                   # Admin analytics
    └── health/                      # Health check endpoint

prisma/
├── schema.prisma                    # Single source of truth for DB schema
└── migrations/                      # Never run migrate reset in production
```

---

## 2. Bootstrap & main.ts

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { TranslationInterceptor } from './common/interceptors/translation.interceptor';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { MyLoggerService } from './core/logger/my-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,    // needed for webhook HMAC verification
    bodyParser: false,
  });

  // ─── Body parsers (custom — needed for rawBody capture) ───────────────────
  app.use(express.json({
    limit: '50mb',
    verify: (req: any, _res, buf) => { req.rawBody = buf; },
  }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ─── Security ─────────────────────────────────────────────────────────────
  app.use(cookieParser());
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // ─── CORS ──────────────────────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL,
      ...(isDev ? [/https:\/\/.*\.ngrok-free\.app$/] : []),
    ],
    credentials: true,
    allowedHeaders: [
      'Content-Type', 'Authorization', 'x-language', 'x-currency',
      'x-skip-translation', 'x-session-id', 'x-guest-id',
    ],
  });

  // ─── Global pipes / interceptors / filters ────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      // Map class-validator errors to fieldErrors: { field: message }
      const fieldErrors: Record<string, string> = {};
      errors.forEach(err => {
        fieldErrors[err.property] = Object.values(err.constraints || {})[0];
      });
      return new BadRequestException({ message: 'Validation failed', fieldErrors });
    },
  }));

  app.useGlobalInterceptors(new TranslationInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const logger = app.get(MyLoggerService);
  app.useLogger(logger);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

**Key decisions:**
- `rawBody: true` + custom body parsers → `req.rawBody` available for webhook signature verification
- `TranslationInterceptor` registered globally here (not as `APP_INTERCEPTOR`) — runs after `CurrencyInterceptor`
- `CurrencyInterceptor` registered as `APP_INTERCEPTOR` in AppModule so it runs first
- `bufferLogs: true` → waits for logger to be ready before outputting bootstrap logs

---

## 3. App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as Joi from 'joi';
import { CurrencyInterceptor } from './core/interceptors/currency.interceptor';

@Module({
  imports: [
    // ─── Config (validates all env vars at startup) ────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        // ... all other required env vars
      }),
    }),

    // ─── Infrastructure ────────────────────────────────────────────────────
    DatabaseModule,      // provides DatabaseService
    RedisModule,         // @Global, provides REDIS_CLIENT token
    HashingModule,       // @Global, provides HashingService
    EmailModule,         // @Global, provides EmailService
    MyLoggerModule,      // @Global

    // ─── Scheduling + Events ───────────────────────────────────────────────
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    // ─── Rate limiting (global: 100 req/60s) ──────────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ─── Feature modules ───────────────────────────────────────────────────
    AuthModule, UsersModule, ProductsModule, CategoriesModule,
    CartModule, CheckoutModule, OrdersModule, PaymentModule,
    // ... all other modules
  ],
  providers: [
    // CurrencyInterceptor runs on EVERY response (converts cents → target currency)
    { provide: APP_INTERCEPTOR, useClass: CurrencyInterceptor },
  ],
})
export class AppModule {}
```

---

## 4. Database (Prisma + PostgreSQL)

### Setup

```typescript
// src/database/database.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 50,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  // Bilingual full-text search helper
  async searchJsonFields(
    table: 'Product' | 'Category' | 'Brand',
    jsonField: 'name' | 'description',
    term: string,
  ): Promise<string[]> {
    const safe = (s: string) => s.replace(/['"\\;]/g, '');
    const t = safe(table); const f = safe(jsonField);
    const words = term.trim().split(/\s+/);
    const conditions = words.map(w =>
      `("${f}"->>'en' ILIKE '%${safe(w)}%' OR "${f}"->>'ar' ILIKE '%${safe(w)}%')`
    ).join(' AND ');
    const rows: { id: string }[] = await this.$queryRawUnsafe(
      `SELECT id FROM "${t}" WHERE ${conditions}`
    );
    return rows.map(r => r.id);
  }
}
```

### Schema Patterns

```prisma
// prisma/schema.prisma

// ─── Multilingual fields: ALWAYS Json, never String ────────────────────────
model Product {
  id               String   @id @default(cuid())
  name             Json     // { en: "...", ar: "..." }
  description      Json     // { en: "...", ar: "..." }
  shortDescription Json?    // { en: "...", ar: "..." }
  slug             String   @unique

  // ─── Pricing in CENTS (integer avoids float errors) ────────────────────
  basePrice        Int      // e.g. 12000 = 120.00 EGP
  compareAtPrice   Int?     // original price before discount

  // ─── Soft delete ────────────────────────────────────────────────────────
  isDeleted        Boolean  @default(false)
  isActive         Boolean  @default(true)

  // ─── Nullable FK (allows deletion without cascade) ──────────────────────
  categoryId       String?
  category         Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  // ─── Timestamps ─────────────────────────────────────────────────────────
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // ─── Strategic indexes ──────────────────────────────────────────────────
  @@index([slug])
  @@index([categoryId])
  @@index([isActive, isDeleted])
  @@index([createdAt])
}

// ─── Hierarchical categories (max 3 levels) ─────────────────────────────────
model Category {
  id       String     @id @default(cuid())
  name     Json       // { en, ar }
  slug     String     @unique
  parentId String?
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]
}

// ─── Auth: User with role, 2FA, lockout, OAuth ──────────────────────────────
enum UserRole { SUPER_ADMIN ADMIN STOCK_MANAGER CUSTOMER_SUPPORT NORMAL_CUSTOMER }
enum AuthProvider { LOCAL GOOGLE }

model User {
  id                  String       @id @default(cuid())
  email               String       @unique
  passwordHash        String?
  role                UserRole     @default(NORMAL_CUSTOMER)
  isEmailVerified     Boolean      @default(false)
  isBlocked           Boolean      @default(false)
  provider            AuthProvider @default(LOCAL)
  googleId            String?      @unique

  // 2FA
  twoFactorSecret     String?
  isTwoFactorEnabled  Boolean      @default(false)
  twoFaFailedAttempts Int          @default(0)
  twoFaLockedUntil    DateTime?

  // Auth security
  failedLoginAttempts Int          @default(0)
  lockedUntil         DateTime?
  refreshTokenHash    String?
  emailOtp            String?
  emailOtpExpiry      DateTime?

  // Push notifications
  fcmTokens           String[]     @default([])
  currency            String       @default("EGP")

  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  @@index([email])
}

// ─── Orders: all money in CENTS, snapshot address ───────────────────────────
enum OrderStatus { PENDING CONFIRMED PREPARING SHIPPED DELIVERED CANCELLED REFUNDED }
enum ShippingMethod { STANDARD EXPRESS PICKUP }
enum PaymentGateway { STRIPE KASHIER COD }

model Order {
  id             String        @id @default(cuid())
  orderNumber    String        @unique
  userId         String
  user           User          @relation(fields: [userId], references: [id])
  status         OrderStatus   @default(PENDING)
  subtotal       Int           // cents
  shippingFee    Int           @default(0) // cents
  discount       Int           @default(0) // cents
  total          Int           // cents
  currency       String        @default("EGP")
  shippingMethod ShippingMethod
  paymentGateway PaymentGateway
  shippingAddress Json         // snapshot { name, phone, address, city, country }
  items          OrderItem[]
  statusLog      OrderStatusLog[]
  trackingNumber String?
  invoiceUrl     String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  @@index([userId])
  @@index([status])
}
```

### Key Prisma Patterns

```typescript
// ─── Transactions ─────────────────────────────────────────────────────────
const result = await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: { ... } });
  await tx.variant.updateMany({
    where: { id: { in: variantIds } },
    data: { stockQuantity: { decrement: qty } },
  });
  return order;
});

// ─── Raw SQL (when Prisma doesn't support the query) ──────────────────────
await this.prisma.$executeRaw`
  UPDATE "Variant"
  SET "stockQuantity" = GREATEST(0, "stockQuantity" - ${qty})
  WHERE id = ${variantId}
`;

// ─── Bilingual text search ────────────────────────────────────────────────
const ids = await this.prisma.searchJsonFields('Product', 'name', searchTerm);
const products = await this.prisma.product.findMany({
  where: { id: { in: ids } },
});
```

---

## 5. Redis Module

```typescript
// src/core/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [{
    provide: REDIS_CLIENT,
    useFactory: () => {
      const client = new Redis(process.env.REDIS_URL, {
        connectTimeout: 10_000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
      client.on('error', (err) => console.error('Redis error:', err));
      return client;
    },
  }],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
```

### Redis Key Conventions

```typescript
// ─── KEYS (use constants, never raw strings) ──────────────────────────────
const REDIS_KEYS = {
  // Cart
  userCart: (userId: string) => `cart:user:${userId}`,
  guestCart: (guestId: string) => `cart:session:${guestId}`,
  activeUsers: 'cart:active_users',          // SET

  // Inventory locks
  lock: (variantId: string, userId: string) => `inventory:lock:v:${variantId}:u:${userId}`,
  lockIndex: (variantId: string) => `inventory:lock:index:v:${variantId}`,  // HASH

  // Exchange rates
  exchangeRates: 'exchange_rates',            // HASH: currency → rate

  // Filter cache
  filtersVersion: 'filters:version',
  filters: (version: string, categoryId: string) => `filters:${version}:${categoryId}`,

  // Auth
  userBlocked: (userId: string) => `user:blocked:${userId}`,
  twoFaFailed: (userId: string) => `2fa:failed:${userId}`,

  // App
  megaMenu: 'mega-menu',                      // STRING (JSON)
  homeData: 'home:data',                      // STRING (JSON)
};

// ─── TTLs (seconds) ───────────────────────────────────────────────────────
const TTL = {
  userCart: 30 * 24 * 60 * 60,    // 30 days
  guestCart: 7 * 24 * 60 * 60,    // 7 days
  inventoryLock: 15 * 60,          // 15 minutes
  filters: 600,                    // 10 minutes
  megaMenu: 60 * 60,               // 1 hour
  homeData: 60,                    // 1 minute
};
```

### Inject Redis in a Service

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../../core/redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class SomeService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async cacheExample() {
    // String
    await this.redis.setex('key', 3600, JSON.stringify(data));
    const raw = await this.redis.get('key');
    const data = raw ? JSON.parse(raw) : null;

    // Hash
    await this.redis.hset('exchange_rates', { USD: '0.021', EUR: '0.019' });
    const rate = await this.redis.hget('exchange_rates', 'USD');

    // Set
    await this.redis.sadd('cart:active_users', userId);
    const members = await this.redis.smembers('cart:active_users');

    // Atomic increment + TTL
    const count = await this.redis.incr('2fa:failed:userId');
    if (count === 1) await this.redis.expire('2fa:failed:userId', 900);
  }
}
```

---

## 6. Authentication System

### JWT Strategy (Access Token)

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../../core/redis/redis.module';
import Redis from 'ioredis';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string; role: UserRole }) {
    // Fast Redis check — avoids DB hit on every request
    const blocked = await this.redis.exists(`user:blocked:${payload.sub}`);
    if (blocked) throw new UnauthorizedException('Account is blocked');
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Refresh Token Strategy

```typescript
// src/modules/auth/strategies/refresh-token.strategy.ts
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.refreshToken,  // httpOnly cookie
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException();
    // Verify hash (refresh tokens are stored hashed)
    const valid = await this.hashingService.compare(
      req.cookies.refreshToken, user.refreshTokenHash
    );
    if (!valid) throw new UnauthorizedException('Invalid refresh token');
    return user;
  }
}
```

### Auth Service Core

```typescript
// src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  // ─── Token generation ──────────────────────────────────────────────────
  async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' }
      ),
      this.jwtService.signAsync(
        { sub: user.id },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '30d' }
      ),
    ]);

    // Store refresh token as hash in DB
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await this.hashingService.hash(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  // ─── Set refresh token as httpOnly cookie ─────────────────────────────
  setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days ms
    });
  }

  // ─── Account lockout (brute force protection) ─────────────────────────
  async handleFailedLogin(user: User) {
    const attempts = user.failedLoginAttempts + 1;
    const locked = attempts >= 5;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: locked ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
      },
    });
    if (locked) {
      await this.notificationsService.sendAdminNotification({
        title: { en: 'Account Locked', ar: 'حساب مقفل' },
        message: { en: `${user.email} locked after 5 failed attempts`, ar: '...' },
        type: 'SECURITY',
      });
      throw new ForbiddenException({ lockoutUntil: new Date(Date.now() + 15 * 60 * 1000) });
    }
  }

  // ─── 2FA: TOTP ────────────────────────────────────────────────────────
  async generate2FA(userId: string) {
    const secret = new OTPAuth.Secret();
    const totp = new OTPAuth.TOTP({ issuer: 'YourApp', label: userId, secret });
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret.base32 } });
    return { secret: secret.base32, qrCode: await qrcode.toDataURL(totp.toString()) };
  }

  async validate2FA(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return false;
    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret) });
    return totp.validate({ token: code, window: 1 }) !== null;
  }

  // ─── Google OAuth: one-time code exchange (prevents tokens in URL) ────
  async exchangeGoogleCode(code: string) {
    // code is a short-lived random string stored in Redis
    const data = await this.redis.get(`google:code:${code}`);
    if (!data) throw new UnauthorizedException('Invalid or expired code');
    await this.redis.del(`google:code:${code}`);
    return JSON.parse(data); // { accessToken, refreshToken }
  }
}
```

### Auth Controller Patterns

```typescript
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  // Rate-limited endpoints
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) { ... }

  @Post('password/forgot')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) { ... }

  @Post('2fa/authenticate')
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  async authenticate2FA(@Body() dto: TwoFADto) { ... }

  // Protected endpoints
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser() user: AuthenticatedUser) { return user; }

  // Admin-only
  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listUsers() { ... }

  // Refresh token rotation
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(@GetUser() user: User, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.generateTokens(user);
    this.authService.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  // Google OAuth callback: issue one-time code instead of tokens in URL
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@GetUser() user: GoogleUser, @Res() res: Response) {
    const tokens = await this.authService.handleGoogleUser(user);
    const code = crypto.randomUUID();
    await this.redis.setex(`google:code:${code}`, 120, JSON.stringify(tokens));
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${code}`);
  }
}
```

---

## 7. Guards & Decorators

```typescript
// ─── @GetUser() decorator ─────────────────────────────────────────────────
export const GetUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return field ? request.user?.[field] : request.user;
  },
);

// Usage:
@GetUser() user: AuthenticatedUser
@GetUser('id') userId: string

// ─── @Roles() decorator ───────────────────────────────────────────────────
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// ─── RolesGuard ───────────────────────────────────────────────────────────
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!roles) return true;  // No @Roles → public
    const { user } = context.switchToHttp().getRequest();
    return roles.includes(user?.role);
  }
}

// ─── OptionalJwtAuthGuard (for public routes that can be enhanced with auth) ──
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user || null;  // Never throw, just return null if no user
  }
}
```

---

## 8. Interceptors

### Translation Interceptor

```typescript
// src/common/interceptors/translation.interceptor.ts
@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Skip admin routes and explicit bypass
    if (
      request.headers['x-skip-translation'] === 'true' ||
      request.url.includes('/admin/') ||
      request.url.includes('/api/admin/')
    ) return next.handle();

    const rawLang = request.headers['accept-language'] || request.headers['x-language'];
    const lang = rawLang?.toLowerCase().startsWith('ar') ? 'ar' : 'en';

    return next.handle().pipe(map((data) => this.transform(data, lang)));
  }

  private transform(data: any, lang: string): any {
    if (data === null || data === undefined || typeof data !== 'object' || data instanceof Date)
      return data;
    if (Array.isArray(data)) return data.map(item => this.transform(item, lang));

    const keys = Object.keys(data);
    // Detection: object with ar+en keys and ≤3 total keys = translation object
    if ('ar' in data && 'en' in data && keys.length <= 3) {
      return data[lang] || data['en'] || data['ar'] || '';
    }

    const result: Record<string, any> = {};
    for (const key of keys) result[key] = this.transform(data[key], lang);
    return result;
  }
}
```

### Currency Interceptor

```typescript
// src/core/interceptors/currency.interceptor.ts
// Converts ALL price fields from cents → target currency on every response
// Pattern: field name matches /(price|total|discount|fee|amount|subtotal|min|max)$/i

@Injectable()
export class CurrencyInterceptor implements NestInterceptor {
  // Field name regex for auto-detection
  private readonly PRICE_FIELDS = /(price|total|discount|fee|amount|subtotal|min|max)$/i;
  // Skip auth/user routes (no financial data)
  private readonly SKIP_PATTERNS = ['/auth/', '/users/', '/admin/users/'];

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    if (this.SKIP_PATTERNS.some(p => req.url.includes(p))) return next.handle();

    const targetCurrency = req.headers['x-currency'] || 'EGP';

    return next.handle().pipe(
      switchMap(async (data) => {
        const rate = await this.getRate(targetCurrency);
        return this.convertFields(data, rate);
      })
    );
  }

  private convertFields(data: any, rate: number): any {
    if (typeof data === 'number') return Math.round(data * rate * 100) / 100;
    if (Array.isArray(data)) return data.map(i => this.convertFields(i, rate));
    if (data && typeof data === 'object' && !(data instanceof Date)) {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [
          k,
          this.PRICE_FIELDS.test(k) && typeof v === 'number'
            ? Math.round((v / 100) * rate * 100) / 100
            : this.convertFields(v, rate)
        ])
      );
    }
    return data;
  }
}
```

---

## 9. Error Handling

```typescript
// src/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let message: string | string[] = 'Internal server error';
    let fieldErrors: Record<string, string> | undefined;
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as any;
      message = body.message || exception.message;
      fieldErrors = body.fieldErrors;
      errorCode = body.errorCode;

    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        // Unique constraint violation
        status = 409;
        const field = (exception.meta?.target as string[])?.[0];
        message = `${field || 'Value'} already exists`;
        fieldErrors = field ? { [field]: message } : undefined;
      } else if (exception.code === 'P2025') {
        status = 404;
        message = 'Record not found';
      } else {
        status = 400;
        message = 'Database error';
      }

    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = 422;
      message = process.env.NODE_ENV === 'production'
        ? 'Invalid data provided'
        : exception.message;
    }

    this.logger.error(`${req.method} ${req.url} → ${status}`, exception);

    res.status(status).json({
      statusCode: status,
      message,
      ...(fieldErrors && { fieldErrors }),
      ...(errorCode && { errorCode }),
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
```

---

## 10. Validation & DTOs

```typescript
// ─── Multilingual DTO ─────────────────────────────────────────────────────
export class MultilingualDto {
  @IsString() @IsNotEmpty() en: string;
  @IsString() @IsNotEmpty() ar: string;

  // Convert to Prisma JSON-compatible format
  static toJson(dto: MultilingualDto): Prisma.InputJsonValue {
    return { en: dto.en, ar: dto.ar } as Prisma.InputJsonValue;
  }
}

// ─── Product DTO example ──────────────────────────────────────────────────
export class CreateProductDto {
  @ValidateNested() @Type(() => MultilingualDto) name: MultilingualDto;
  @ValidateNested() @Type(() => MultilingualDto) description: MultilingualDto;
  @ValidateNested() @IsOptional() @Type(() => MultilingualDto) shortDescription?: MultilingualDto;
  @IsString() @IsNotEmpty() slug: string;
  @IsInt() @Min(0) basePrice: number;  // in CENTS
  @IsString() @IsOptional() categoryId?: string;
}

// ─── Response transformation: exclude sensitive fields ────────────────────
// Use class-transformer's @Exclude() + ClassSerializerInterceptor
// Or manually omit in service:
const { passwordHash, refreshTokenHash, ...safeUser } = user;
return safeUser;
```

---

## 11. Pagination

```typescript
// ─── Request DTO ─────────────────────────────────────────────────────────
export class PageOptionsDto {
  @IsOptional() @IsEnum(['asc', 'desc']) order: 'asc' | 'desc' = 'desc';
  @IsOptional() @IsString() orderBy: string = 'createdAt';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit: number = 10;
  @IsOptional() @IsString() search?: string;

  get skip() { return (this.page - 1) * this.limit; }
}

// ─── Meta ─────────────────────────────────────────────────────────────────
export class PageMetaDto {
  readonly page: number;
  readonly limit: number;
  readonly itemCount: number;
  readonly pageCount: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;

  constructor({ pageOptionsDto, itemCount }: { pageOptionsDto: PageOptionsDto; itemCount: number }) {
    this.page = pageOptionsDto.page;
    this.limit = pageOptionsDto.limit;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(itemCount / pageOptionsDto.limit);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}

// ─── Page wrapper ────────────────────────────────────────────────────────
export class PageDto<T> {
  readonly data: T[];
  readonly meta: PageMetaDto;
  constructor(data: T[], meta: PageMetaDto) { this.data = data; this.meta = meta; }
}

// ─── Usage in service ─────────────────────────────────────────────────────
async findAll(dto: PageOptionsDto): Promise<PageDto<Product>> {
  const [items, total] = await this.prisma.$transaction([
    this.prisma.product.findMany({
      skip: dto.skip,
      take: dto.limit,
      orderBy: { [dto.orderBy]: dto.order },
      where: dto.search ? { id: { in: await this.prisma.searchJsonFields('Product', 'name', dto.search) } } : {},
    }),
    this.prisma.product.count({ where: { isDeleted: false } }),
  ]);
  return new PageDto(items, new PageMetaDto({ pageOptionsDto: dto, itemCount: total }));
}
```

---

## 12. Multilingual (i18n)

### Storage Pattern

All user-visible text is stored as `Json` in Prisma (`{ en: "...", ar: "..." }`).

```typescript
// ─── Write ────────────────────────────────────────────────────────────────
await this.prisma.product.create({
  data: {
    name: { en: 'Laptop', ar: 'حاسوب محمول' },           // plain object literal
    description: MultilingualDto.toJson(dto.description),  // or via DTO helper
  },
});

// ─── Read: TranslationInterceptor handles this automatically ─────────────
// The interceptor converts { en: 'Laptop', ar: 'حاسوب محمول' }
// to 'Laptop' or 'حاسوب محمول' based on Accept-Language/x-language header.

// ─── Admin reads: skip translation for raw bilingual data ────────────────
// Set x-skip-translation: true header (or hit /admin/ route which is auto-skipped)

// ─── DB search: custom helper ─────────────────────────────────────────────
const ids = await this.prisma.searchJsonFields('Product', 'name', 'laptop');
```

### Frontend → Backend Headers

```
Accept-Language: ar     →  TranslationInterceptor picks Arabic
x-language: ar          →  Fallback if Accept-Language absent
x-skip-translation: true → Raw { ar, en } object returned (admin use)
```

---

## 13. Currency Handling

### Rules

1. **DB stores CENTS (integers):** 120 EGP = `12000` in DB
2. **CurrencyInterceptor converts on response:** `12000` → `120` (EGP) or `2.52` (USD)
3. **Frontend sends EGP values** — the interceptor converts API preview responses / frontend must multiply ×100 before sending back to create/confirm endpoints

```typescript
// ─── Exchange rate cron ────────────────────────────────────────────────────
@Cron('0 */12 * * *') // Every 12 hours
async updateRates() {
  const res = await fetch(`https://open.er-api.com/v6/latest/EGP`);
  const { rates } = await res.json();
  await this.redis.hmset('exchange_rates', rates);
}

// ─── CurrencyInterceptor reads from Redis ─────────────────────────────────
private async getRate(currency: string): Promise<number> {
  if (currency === 'EGP') return 1;
  const rate = await this.redis.hget('exchange_rates', currency);
  if (!rate) throw new ServiceUnavailableException('Exchange rates unavailable');
  return parseFloat(rate);
}

// ─── Important: confirm endpoints must re-multiply prices! ────────────────
// If preview response shows 120 EGP (interceptor divided 12000 / 100),
// and frontend sends 120 back in the confirm body,
// the confirm endpoint must do: Math.round(price * 100) to get back to cents.
```

---

## 14. Rate Limiting

```typescript
// ─── Global default (in AppModule ThrottlerModule) ────────────────────────
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])

// ─── Per-endpoint override ────────────────────────────────────────────────
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Post('login')
@Throttle({ default: { limit: 10, ttl: 60_000 } })   // 10 req/min
async login() { ... }

@Post('password/forgot')
@Throttle({ default: { limit: 3, ttl: 60_000 } })    // 3 req/min

@Post('2fa/authenticate')
@Throttle({ default: { limit: 5, ttl: 300_000 } })   // 5 req/5min

@Get('public-data')
@SkipThrottle()  // exempt public high-traffic endpoint
async publicData() { ... }

// ─── Controller must have ThrottlerGuard ──────────────────────────────────
@UseGuards(ThrottlerGuard)   // class-level, or add to global guards
```

---

## 15. Event-Driven Architecture

```typescript
// ─── Emit events ──────────────────────────────────────────────────────────
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VariantsService {
  constructor(private eventEmitter: EventEmitter2) {}

  async updatePrice(variantId: string, newPrice: number) {
    await this.prisma.variant.update({ where: { id: variantId }, data: { specificPrice: newPrice } });
    this.eventEmitter.emit('variant.price.dropped', { variantId, newPrice });
  }
}

// ─── Listen to events ─────────────────────────────────────────────────────
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class WishlistEventListener {
  @OnEvent('variant.price.dropped')
  async handlePriceDrop(payload: { variantId: string; newPrice: number }) {
    // Find all users who have this variant wishlisted
    const wishlistedBy = await this.prisma.wishlist.findMany({
      where: { variantId: payload.variantId },
      select: { userId: true, user: { select: { fcmTokens: true } } },
    });

    // Fan-out notifications (chunk to avoid memory issues)
    const CHUNK = 100;
    for (let i = 0; i < wishlistedBy.length; i += CHUNK) {
      const chunk = wishlistedBy.slice(i, i + CHUNK);
      await this.notificationsService.createBulk(chunk.map(w => ({
        userId: w.userId,
        type: 'PRICE_DROP',
        title: { en: 'Price dropped!', ar: 'انخفض السعر!' },
        message: { en: `An item in your wishlist dropped in price`, ar: '...' },
      })));
    }
  }

  @OnEvent('variant.stock.low')
  async handleLowStock(payload: { variantId: string }) { ... }
}

// ─── Standard events used in this architecture ────────────────────────────
'user.login'              // payload: { userId, sessionId } → cart migration
'variant.price.dropped'   // payload: { variantId, oldPrice, newPrice }
'variant.stock.low'       // payload: { variantId, currentStock }
'order.status.changed'    // payload: { orderId, oldStatus, newStatus }
```

---

## 16. Cart & Inventory Pattern

### Redis Cart Structure

```typescript
interface CartData {
  items: Record<string, CartItem>;  // key = variantId
  promoCode?: string;
}

interface CartItem {
  variantId: string;
  quantity: number;
  priceSnapshot: number;  // cents, at time of adding
  addedAt: string;        // ISO timestamp
}
```

### Cart Cache Repository

```typescript
@Injectable()
export class CartCacheRepository {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  private key(userId?: string, guestId?: string) {
    return userId ? `cart:user:${userId}` : `cart:session:${guestId}`;
  }

  async getCart(userId?: string, guestId?: string): Promise<CartData> {
    const raw = await this.redis.get(this.key(userId, guestId));
    return raw ? JSON.parse(raw) : { items: {} };
  }

  async saveCart(cart: CartData, userId?: string, guestId?: string) {
    const ttl = userId ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    await this.redis.setex(this.key(userId, guestId), ttl, JSON.stringify(cart));
    if (userId) await this.redis.sadd('cart:active_users', userId);
  }

  async deleteCart(userId?: string, guestId?: string) {
    await this.redis.del(this.key(userId, guestId));
    if (userId) await this.redis.srem('cart:active_users', userId);
  }
}
```

### Inventory Lock Service

```typescript
@Injectable()
export class InventoryLockService {
  // Lock: reserve {quantity} units for {userId} on {variantId}
  async lock(variantId: string, userId: string, quantity: number, ttlSecs = 900) {
    const lockKey = `inventory:lock:v:${variantId}:u:${userId}`;
    const indexKey = `inventory:lock:index:v:${variantId}`;

    await this.redis.setex(lockKey, ttlSecs, quantity.toString());
    await this.redis.hset(indexKey, userId, quantity.toString());
    await this.redis.expire(indexKey, ttlSecs);
  }

  async getTotalLocked(variantId: string): Promise<number> {
    const index = await this.redis.hgetall(`inventory:lock:index:v:${variantId}`);
    return Object.values(index).reduce((sum, q) => sum + parseInt(q), 0);
  }

  async releaseLock(variantId: string, userId: string) {
    await this.redis.del(`inventory:lock:v:${variantId}:u:${userId}`);
    await this.redis.hdel(`inventory:lock:index:v:${variantId}`, userId);
  }
}
```

### DB Sync Cron

```typescript
@Injectable()
export class CartSyncService {
  @Cron('*/15 * * * *') // Every 15 minutes
  async handlePeriodicSync() {
    const userIds = await this.cartRepository.redis.smembers('cart:active_users');
    const CONCURRENCY = 20;
    for (let i = 0; i < userIds.length; i += CONCURRENCY) {
      const chunk = userIds.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map(uid =>
        this.syncRedisToDb(uid).catch(e => this.logger.error(`Cart sync failed for ${uid}`, e))
      ));
    }
  }

  private async syncRedisToDb(userId: string) {
    const cart = await this.cartRepository.getCart(userId);
    if (Object.keys(cart.items).length === 0) {
      await this.cartRepository.redis.srem('cart:active_users', userId);
      return;
    }
    // Upsert each item to DB...
  }
}
```

---

## 17. Checkout & Payment Pattern

### Payment Strategy Interface

```typescript
interface IPaymentStrategy {
  createPaymentIntent(
    order: Order, user: User, amountCents: number, currency: string
  ): Promise<PaymentResponse>;
  refund?(transactionId: string, amountCents: number, reason?: string): Promise<RefundResponse>;
}

interface PaymentResponse {
  clientSecret?: string;   // Stripe
  paymentUrl?: string;     // Kashier
  transactionId: string;
  sessionId?: string;
}

// ─── Resolver ────────────────────────────────────────────────────────────
@Injectable()
export class PaymentStrategyResolver {
  constructor(
    private stripe: StripeStrategy,
    private kashier: KashierStrategy,
    private cod: CodStrategy,
  ) {}

  resolve(gateway: PaymentGateway): IPaymentStrategy {
    const map = { STRIPE: this.stripe, KASHIER: this.kashier, COD: this.cod };
    const strategy = map[gateway];
    if (!strategy) throw new BadRequestException(`Unsupported gateway: ${gateway}`);
    return strategy;
  }
}
```

### Webhook Idempotency

```typescript
@Injectable()
export class WebhookService {
  async processWebhook(provider: string, eventId: string, handler: () => Promise<void>) {
    // Check idempotency key
    const existing = await this.prisma.processedWebhook.findUnique({
      where: { provider_eventId: { provider, eventId } },
    });
    if (existing) return; // Already processed

    await handler();

    // Mark as processed
    await this.prisma.processedWebhook.create({
      data: { provider, eventId, processedAt: new Date() },
    });
  }
}

// ─── Webhook signature verification ──────────────────────────────────────
// Stripe
const event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

// Kashier (HMAC-SHA256)
const expected = crypto.createHmac('sha256', process.env.KASHIER_WEBHOOK_SECRET)
  .update(req.rawBody).digest('hex');
if (expected !== req.headers['x-kashier-signature']) throw new UnauthorizedException();
```

---

## 18. Notifications (FCM + In-App)

```typescript
@Injectable()
export class NotificationsService {
  // ─── Create in-app notification ──────────────────────────────────────
  async create(userId: string, data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,   // { en, ar } → stored as Json
        message: data.message,
        link: data.link,
        isRead: false,
      },
    });
  }

  // ─── Fan-out to all admins (guarded: max 200) ─────────────────────────
  async sendAdminNotification(data: AdminNotificationDto) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] } },
      take: 200,
      select: { id: true, fcmTokens: true },
    });

    await this.prisma.notification.createMany({
      data: admins.map(a => ({ userId: a.id, ...data })),
    });

    const allTokens = admins.flatMap(a => a.fcmTokens).filter(Boolean);
    if (allTokens.length > 0) {
      await this.firebaseService.sendPushNotification(
        allTokens, data.title.en, data.message.en
      );
    }
  }
}

// ─── Firebase Service ─────────────────────────────────────────────────────
@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {  // Prevent re-init on hot reload
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      });
    }
  }

  async sendPushNotification(tokens: string[], title: string, body: string) {
    const BATCH_SIZE = 500; // FCM multicast limit
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const chunk = tokens.slice(i, i + BATCH_SIZE);
      const response = await admin.messaging().sendEachForMulticast({
        tokens: chunk, notification: { title, body },
      });
      // Prune invalid tokens
      await this.pruneInvalidTokens(chunk, response);
    }
  }
}
```

---

## 19. File Uploads (Cloudinary)

```typescript
@Injectable()
export class MediaService {
  async uploadImage(file: Express.Multer.File, folder = 'uploads'): Promise<string> {
    const buffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result!.secure_url),
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}

// ─── Controller ───────────────────────────────────────────────────────────
@Post('upload')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new BadRequestException('Images only'), false);
    cb(null, true);
  },
}))
async upload(@UploadedFile() file: Express.Multer.File) {
  const url = await this.mediaService.uploadImage(file);
  return { url };
}
```

---

## 20. Email Service

```typescript
@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(email: string, otp: string) {
    await this.resend.emails.send({
      from: `Your App <noreply@${process.env.EMAIL_DOMAIN}>`,
      to: email,
      subject: 'Verify your email',
      html: this.buildOtpEmail('Verify Email', otp, 'This code expires in 1 hour'),
    });
  }

  async sendOrderConfirmationEmail(email: string, order: Order) { ... }

  private buildOtpEmail(title: string, otp: string, note: string): string {
    return `
      <div style="font-family:Arial;max-width:600px;margin:auto">
        <div style="background:#0C287B;padding:20px;text-align:center">
          <h1 style="color:white">${title}</h1>
        </div>
        <div style="padding:30px">
          <p style="font-size:32px;font-weight:bold;text-align:center;letter-spacing:8px">${otp}</p>
          <p style="color:#666">${note}</p>
        </div>
      </div>
    `;
  }
}
```

---

## 21. Webhook Idempotency Pattern

```prisma
// Schema
model ProcessedWebhook {
  id          String   @id @default(cuid())
  provider    String   // 'stripe' | 'kashier'
  eventId     String
  processedAt DateTime @default(now())
  @@unique([provider, eventId])
}

model FailedWebhook {
  id        String              @id @default(cuid())
  provider  String
  payload   Json
  error     String
  status    FailedWebhookStatus @default(PENDING)
  createdAt DateTime            @default(now())
  retryAt   DateTime?
}

enum FailedWebhookStatus { PENDING RETRYING RESOLVED ABANDONED }
```

---

## 22. Soft Deletes

```typescript
// ─── Schema: add isDeleted Boolean @default(false) ──────────────────────
// ─── Always filter in queries ────────────────────────────────────────────
await this.prisma.product.findMany({ where: { isDeleted: false } });

// ─── Soft delete ─────────────────────────────────────────────────────────
async softDelete(id: string) {
  await this.prisma.product.update({ where: { id }, data: { isDeleted: true } });
}

// ─── Hard delete (only when re-importing / admin force) ───────────────────
async hardDelete(id: string) {
  await this.prisma.variant.deleteMany({ where: { productId: id } });
  await this.prisma.product.delete({ where: { id } });
}
```

---

## 23. Module Template

```typescript
// ─── Feature module boilerplate ───────────────────────────────────────────
// src/modules/feature/feature.module.ts
@Module({
  imports: [
    DatabaseModule,   // if not already global
    // other required modules
  ],
  controllers: [FeatureController, AdminFeatureController],
  providers: [FeatureService],
  exports: [FeatureService],  // export if other modules need it
})
export class FeatureModule {}

// ─── Controller split: storefront vs admin ────────────────────────────────
// GET /api/feature/...           → FeatureController (public / authenticated)
// GET /api/admin/feature/...     → AdminFeatureController (staff only)

@Controller('feature')
export class FeatureController {
  @Get()
  findAll() { ... }

  @Get(':id')
  findOne(@Param('id') id: string) { ... }
}

@Controller('admin/feature')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AdminFeatureController {
  @Get() findAll() { ... }
  @Post() create(@Body() dto: CreateFeatureDto) { ... }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateFeatureDto) { ... }
  @Delete(':id') remove(@Param('id') id: string) { ... }
  @Delete('bulk') removeBulk(@Body() dto: { ids: string[] }) { ... }
}
```

---

## 24. Environment Variables

```bash
# ─── Database ──────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# ─── Redis ─────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Auth ──────────────────────────────────────────────────────────────────
JWT_SECRET=<min 32 chars random string>
JWT_REFRESH_SECRET=<min 32 chars random string>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# ─── Google OAuth ──────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback

# ─── Frontend ──────────────────────────────────────────────────────────────
FRONTEND_URL=https://yourdomain.com

# ─── Email (Resend) ────────────────────────────────────────────────────────
RESEND_API_KEY=re_...
EMAIL_DOMAIN=yourdomain.com
EMAIL_FROM_NAME=YourApp

# ─── Cloudinary ────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ─── Firebase (FCM) ────────────────────────────────────────────────────────
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # JSON string

# ─── Payment ───────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
KASHIER_MERCHANT_ID=
KASHIER_API_KEY=
KASHIER_WEBHOOK_SECRET=
KASHIER_MODE=live  # or test

# ─── Exchange Rates ────────────────────────────────────────────────────────
EXCHANGE_RATE_API_KEY=  # optional, openexchangerates or er-api.com

# ─── App ───────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
```

---

## 25. Security Checklist

| Check | Implementation |
|-------|---------------|
| SQL injection | Prisma parameterized queries; raw SQL uses tagged templates |
| XSS | Helmet headers; validation strips unexpected fields |
| Brute force (login) | 10 req/min throttle + 5-attempt lockout with 15-min ban |
| Brute force (2FA) | 5 req/5min throttle + 5-attempt lockout |
| Password reset | 5 req/5min throttle + OTP expiry 1h |
| Token security | Access tokens 15m; refresh tokens 30d stored hashed in DB |
| Cookie security | httpOnly, secure, sameSite=lax on refresh token cookie |
| OAuth security | One-time code exchange (no tokens in redirect URL) |
| Webhook integrity | Stripe: HMAC + SDK verification; Kashier: HMAC-SHA256 on rawBody |
| Webhook duplication | Idempotency table (provider + eventId unique constraint) |
| Overselling | Redis inventory locks with 15-min TTL during checkout |
| Input validation | `ValidationPipe` whitelist+forbidNonWhitelisted; custom fieldErrors |
| Sensitive data | Passwords/tokens hashed; refresh token hash stored only, never plaintext |
| CORS | Explicit origin allowlist; `credentials: true` |
| Rate limiting | Global 100/60s; per-endpoint overrides via `@Throttle` |
| Account enumeration | Generic error messages on auth failures |
| Admin access | JWT + RolesGuard on all `/admin/` routes; role hierarchy enforced |
| File uploads | MIME type check + 10MB limit + Cloudinary (no local storage) |
| Money precision | All prices stored as integers (cents) — no floating-point errors |
| Notification spam | Admin fan-out capped at 200 users; FCM chunked at 500 tokens |

---

## Quick Reference: Response Shapes

### Standard success
```json
{ "data": [...], "meta": { "page": 1, "limit": 10, "itemCount": 42, "pageCount": 5, "hasNextPage": true, "hasPreviousPage": false } }
```

### Validation error (400)
```json
{ "statusCode": 400, "message": "Validation failed", "fieldErrors": { "email": "must be a valid email", "price": "must be a positive integer" } }
```

### Unique constraint (409)
```json
{ "statusCode": 409, "message": "email already exists", "fieldErrors": { "email": "email already exists" } }
```

### Rate limited (429)
```json
{ "statusCode": 429, "message": "ThrottlerException: Too Many Requests" }
```

### Account locked (403)
```json
{ "statusCode": 403, "message": "Too many failed attempts", "errorCode": "ACCOUNT_LOCKED", "lockoutUntil": "2024-01-01T12:15:00.000Z" }
```

---

*Generated from production backend — update when patterns evolve.*
