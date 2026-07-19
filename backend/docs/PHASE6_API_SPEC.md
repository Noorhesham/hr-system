# Phase 6 API Spec — ESS & Reports

Base: `http://localhost:3004/api`  
Swagger: `http://localhost:3004/docs` · OpenAPI JSON: `http://localhost:3004/docs-json`

## ESS (Employee role only)

Login with `portalCredentials` from `POST /employees`.  
`GET /auth/me` returns `isPortalUser: true` and `employeeId`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ess/me` | Profile + shift + company |
| GET | `/ess/salary-components` | Own allowances/deductions |
| GET | `/ess/documents` | Own documents |
| GET | `/ess/attendance` | Own attendance (paginated) |
| GET | `/ess/loans` | Own loans + installments |
| GET | `/ess/payslips` | Own slips (APPROVED/CLOSED only) |
| GET | `/ess/payslips/:id` | One slip |

Live punch (from Phase 3/4 hardening):
- `POST /attendance/check-in` `{}`
- `POST /attendance/check-out` `{}`
(requires assigned shift)

Company Owner tokens get `403 Insufficient role` on `/ess/*`.

## Reports (Company Owner only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reports/dashboard` | KPIs: employees, loans, open cycles |
| GET | `/reports/payroll-summary?month=&year=` | Totals for a cycle |
| GET | `/reports/attendance-summary?month=&year=` | Present/absent/leave + delay/OT |
| GET | `/reports/gosi?month=&year=` | Per-employee GOSI shares |

## Out of scope (later)

- PDF payslip download / Excel report files
- Leave request workflow & OT request workflow
- Multi-level approvals UI
