# Phase 5 API Spec — Payroll Engine

Base: `http://localhost:3004/api`  
Auth: Bearer (Company Owner for writes / WPS).  
Import: `http://localhost:3004/docs-json` or Swagger UI `http://localhost:3004/docs`

## Lifecycle

```
POST /payroll/cycles          → DRAFT (+ calculate slips)
POST /payroll/cycles/:id/recalculate  (DRAFT only)
PATCH /payroll/cycles/:id/review      DRAFT → REVIEW
PATCH /payroll/cycles/:id/approve     REVIEW → APPROVED (loan installments → DEDUCTED)
PATCH /payroll/cycles/:id/close       APPROVED → CLOSED
GET /payroll/cycles/:id/wps           CSV (APPROVED | CLOSED)
```

## Calculation (per active employee)

Depends on `employee.salaryBasis`:

| Basis | `basicSalary` means | Period earned basic on slip |
|-------|---------------------|----------------------------|
| **MONTHLY** | Month salary | Contract basic; absences deduct day-rate (`basic/30`) |
| **DAILY** | Pay per PRESENT day | `rate × PRESENT days` (+ LEAVE × `(1 − excusedMultiplier)`) |
| **HOURLY** | Hourly rate | `rate × regular hours` from check-in/out (OT excluded from regular) |

**Adds:** earned basic + allowances (fixed or % of **earned** basic) + overtime bonus  
(`OT hours × hourRate × normal/holiday multiplier`; weekend days from policy)

**Hour rates:** MONTHLY → `(basic/30)/8` · DAILY → `basic/8` · HOURLY → `basic`

**Subtracts into `totalDeductions`:** component deductions + absence  
(MONTHLY only: ABSENT × unexcused, LEAVE × excused) + delay  
(PER_MINUTE or FIXED_AMOUNT=1 hour-rate per late day) + employee GOSI  
(`(earnedBasic+allowances) × gosiEmployee%` if `isGosiRegistered`)

**Also:** `loanDeductions` = PENDING installments with `dueDate` in that month

`netSalary = max(0, earnedBasic + allowances + OT − totalDeductions − loanDeductions)`

## Endpoints

| Method | Path | Role | Notes |
|--------|------|------|-------|
| POST | `/payroll/cycles` | Owner | Body `{ month, year }` |
| GET | `/payroll/cycles` | any | Paginated; filter status/month/year |
| GET | `/payroll/cycles/:id` | any | Includes slips |
| GET | `/payroll/slips/:slipId` | any | Single slip |
| POST | `/payroll/cycles/:id/recalculate` | Owner | DRAFT only |
| PATCH | `/payroll/cycles/:id/review` | Owner | |
| PATCH | `/payroll/cycles/:id/approve` | Owner | Locks loans |
| PATCH | `/payroll/cycles/:id/close` | Owner | Final |
| GET | `/payroll/cycles/:id/wps` | Owner | Downloads CSV |

## Quick test flow

1. Ensure employees have shifts, attendance, salary components, approved loan with installments due this month.
2. `POST /payroll/cycles` `{ "month": 7, "year": 2026 }` → inspect slips.
3. `PATCH .../review` → `PATCH .../approve` → `GET .../wps`.
4. Portal user: `GET /ess/payslips` (Phase 6) after APPROVED.
