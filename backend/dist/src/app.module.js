"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const core_1 = require("@nestjs/core");
const config_schema_1 = require("./config/config.schema");
const database_module_1 = require("./database/database.module");
const hashing_module_1 = require("./core/hashing/hashing.module");
const my_logger_module_1 = require("./core/logger/my-logger.module");
const auth_module_1 = require("./modules/auth/auth.module");
const company_module_1 = require("./modules/company/company.module");
const platform_module_1 = require("./modules/platform/platform.module");
const employee_module_1 = require("./modules/employee/employee.module");
const document_module_1 = require("./modules/document/document.module");
const shift_module_1 = require("./modules/shift/shift.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const salary_component_module_1 = require("./modules/salary-component/salary-component.module");
const loan_module_1 = require("./modules/loan/loan.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const ess_module_1 = require("./modules/ess/ess.module");
const upload_module_1 = require("./modules/upload/upload.module");
const reports_module_1 = require("./modules/reports/reports.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const plans_module_1 = require("./modules/plans/plans.module");
const leave_module_1 = require("./modules/leave/leave.module");
const department_module_1 = require("./modules/department/department.module");
const role_module_1 = require("./modules/role/role.module");
const request_module_1 = require("./modules/request/request.module");
const notification_module_1 = require("./modules/notification/notification.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: config_schema_1.configValidationSchema,
            }),
            database_module_1.DatabaseModule,
            hashing_module_1.HashingModule,
            my_logger_module_1.MyLoggerModule,
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            auth_module_1.AuthModule,
            company_module_1.CompanyModule,
            platform_module_1.PlatformModule,
            employee_module_1.EmployeeModule,
            document_module_1.DocumentModule,
            shift_module_1.ShiftModule,
            department_module_1.DepartmentModule,
            attendance_module_1.AttendanceModule,
            salary_component_module_1.SalaryComponentModule,
            loan_module_1.LoanModule,
            payroll_module_1.PayrollModule,
            leave_module_1.LeaveModule,
            ess_module_1.EssModule,
            reports_module_1.ReportsModule,
            upload_module_1.UploadModule,
            onboarding_module_1.OnboardingModule,
            plans_module_1.PlansModule,
            role_module_1.RoleModule,
            request_module_1.RequestModule,
            notification_module_1.NotificationModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map