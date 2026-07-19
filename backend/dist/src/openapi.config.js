"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOpenApiConfig = buildOpenApiConfig;
const swagger_1 = require("@nestjs/swagger");
function buildOpenApiConfig() {
    return new swagger_1.DocumentBuilder()
        .setTitle('HR System API')
        .setDescription('Multi-tenant Payroll & HR Management API (Phases 1–6). ' +
        'Import into APIDog via live URL http://localhost:3004/docs-json ' +
        'or backend/postman_collection.json. Swagger UI: http://localhost:3004/docs')
        .setVersion('1.0.0')
        .addServer(`http://localhost:${process.env.PORT ?? '3004'}/api`, 'Local')
        .addBearerAuth()
        .addCookieAuth('refreshToken')
        .addTag('Auth', 'Registration, login, token refresh, logout')
        .addTag('Company', 'Tenant settings / policy (Company Owner to update)')
        .addTag('Platform', 'Global platform defaults — platform admin only')
        .addTag('Employees', 'Employee management + auto portal account')
        .addTag('Documents', 'Employee documents (metadata + URL)')
        .addTag('Shifts', 'Work shift definitions (times + grace period)')
        .addTag('Attendance', 'Check-in/out (shift required), manual entry, bulk; delay/overtime engine')
        .addTag('Salary Components', 'Recurring allowances/deductions per employee')
        .addTag('Loans', 'Employee loans/advances with installment schedules')
        .addTag('Payroll', 'Payroll cycles, calculation engine, approve/close, WPS export')
        .addTag('ESS', 'Employee Self-Service portal (Employee role) — profile, payslips, attendance')
        .addTag('Reports', 'Owner KPIs and monthly summaries (payroll, attendance, GOSI)')
        .build();
}
//# sourceMappingURL=openapi.config.js.map