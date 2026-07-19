import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { configValidationSchema } from './config/config.schema';
import { DatabaseModule } from './database/database.module';
import { HashingModule } from './core/hashing/hashing.module';
import { MyLoggerModule } from './core/logger/my-logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { PlatformModule } from './modules/platform/platform.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { DocumentModule } from './modules/document/document.module';
import { ShiftModule } from './modules/shift/shift.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { SalaryComponentModule } from './modules/salary-component/salary-component.module';
import { LoanModule } from './modules/loan/loan.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { EssModule } from './modules/ess/ess.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // ─── Config ────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),

    // ─── Infrastructure ────────────────────────────────────────────────────
    DatabaseModule,
  
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
    CompanyModule,
    PlatformModule,
    EmployeeModule,
    DocumentModule,
    ShiftModule,
    AttendanceModule,
    SalaryComponentModule,
    LoanModule,
    PayrollModule,
    EssModule,
    ReportsModule,
  ],
  providers: [

    // ThrottlerGuard runs globally on EVERY endpoint
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
