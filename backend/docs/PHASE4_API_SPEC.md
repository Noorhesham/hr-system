# Phase 4 API Spec — Salary Structure & Loans

API reference for **APIDog / Postman**. Covers the two financial *input*
modules that feed the payroll engine:

- Salary Components: `POST /employees/:employeeId/salary-components`,
  `GET /employees/:employeeId/salary-components`,
  `PATCH /salary-components/:id`, `DELETE /salary-components/:id`
- Loans: `POST /employees/:employeeId/loans`,
  `GET /employees/:employeeId/loans`, `GET /loans`, `GET /loans/:id`,
  `PATCH /loans/:id/approve`, `DELETE /loans/:id`

---

## Conventions

| Item | Value |
|------|-------|
| Base URL (dev) | `http://localhost:3004/api` (global `/api` prefix, port 3004) |
| Content type | `application/json` |
| Auth scheme | `Authorization: Bearer <accessToken>` |
| Tenant | `companyId` is always taken from the JWT (never the client). Records are tenant-scoped through their parent `Employee`. |
| Guards | `JwtAuthGuard` + `TenantGuard` + `RolesGuard` on all routes |
| Authorization (RBAC) | All **writes** (`POST` / `PATCH` / `DELETE`) require the **Company Owner** role. Any authenticated tenant member may read. |
| Money | Monetary fields are Prisma `Decimal` and serialize as **strings** (e.g. `"1000"`). Send them as numbers with ≤2 decimals. |

Standard error envelope (from the global `AllExceptionsFilter`):
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "fieldErrors": { "amount": "amount must be a number..." },
  "timestamp": "2026-07-14T10:00:00.000Z",
  "path": "/employees/uuid/salary-components"
}
```

> Prerequisite: a tenant (register), at least one employee, and a
> Company-Owner access token. See `PHASE1_API_SPEC.md` for auth/registration.

---

# Salary Components

A recurring salary line item for an employee. `type` is `ALLOWANCE` or
`DEDUCTION`. When `isPercentage = true`, `amount` is a **0–100** percentage of
the basic salary; otherwise it is a fixed amount.

## 1) `POST /employees/:employeeId/salary-components`

Create a component (Company Owner). `201 Created`.

Body:
```json
{ "type": "ALLOWANCE", "name": "Housing", "amount": 1000, "isPercentage": false }
```
| Field | Rules |
|-------|-------|
| `type` | enum `ALLOWANCE` \| `DEDUCTION`, required |
| `name` | string, required, ≤120 chars |
| `amount` | number ≥ 0, ≤2 decimals, required |
| `isPercentage` | boolean, optional (default `false`) |

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Fixed allowance | body above | `201`; component returned |
| ✅ S2 | Percentage allowance | `amount:10, isPercentage:true` | `201` |
| 🟡 V1 | Invalid type | `type:"BONUS"` | `400` |
| 🟡 V2 | Negative amount | `amount:-5` | `400` (Min 0) |
| 🟡 V3 | Too many decimals | `amount:10.999` | `400` (maxDecimalPlaces 2) |
| 🟡 V4 | Percentage > 100 | `amount:150, isPercentage:true` | `400` |
| 🟡 V5 | Unknown property | add `"foo":1` | `400` (forbidNonWhitelisted) |
| 🟠 E1 | Unknown employee | random `:employeeId` | `404` "Employee not found" |
| 🔒 SEC1 | Non-owner token | Employee-portal token | `403` |
| 🔒 T1 | Cross-tenant employee | employee from another company | `404` (isolation) |

## 2) `GET /employees/:employeeId/salary-components`

List a given employee's components (any tenant member). `200 OK` — array,
newest first.

## 3) `PATCH /salary-components/:id`

Partial update (Company Owner). Send only changed fields; percentage range is
re-validated against the effective values.

Body (all optional): `{ "amount": 1500 }`

| # | Scenario | Expected |
|---|----------|----------|
| ✅ S1 | Update amount | `200` |
| 🟡 V1 | Flip to percentage with amount > 100 | `PATCH {isPercentage:true}` on a component whose amount is 150 → `400` |
| 🟠 E1 | Unknown id | `404` |
| 🔒 T1 | Component in another tenant | `404` |

## 4) `DELETE /salary-components/:id`

Remove a component (Company Owner). `200 OK` → `{ "success": true }`. Unknown /
cross-tenant id → `404`.

---

# Loans

An employee loan/advance repaid via scheduled monthly installments. Lifecycle:
`PENDING` → `APPROVED` (schedule generated) → `PAID_OFF` (set later by the
Phase 5 payroll engine when installments are deducted).

## 5) `POST /employees/:employeeId/loans`

Create a `PENDING` loan (Company Owner). `201 Created`.

Body:
```json
{ "totalAmount": 12000 }
```
| Field | Rules |
|-------|-------|
| `totalAmount` | number > 0, ≤2 decimals, required |

| # | Scenario | Expected |
|---|----------|----------|
| ✅ S1 | Valid loan | `201`; `status:"PENDING"` |
| 🟡 V1 | Zero/negative total | `totalAmount:0` → `400` (IsPositive) |
| 🟠 E1 | Unknown employee | `404` |
| 🔒 SEC1 | Non-owner token | `403` |

## 6) `GET /employees/:employeeId/loans`

List an employee's loans, each including its `installments` (any member).

## 7) `GET /loans`

Company-wide, paginated (`PageDto`). Query: `page`, `limit`, `order`,
`orderBy` (`createdAt` \| `updatedAt` \| `totalAmount`), optional `status`
(enum) and `employeeId`.

```json
{ "data": [ { "id": "...", "totalAmount": "12000", "status": "APPROVED", "employee": { "id": "...", "name": "Ahmed" } } ],
  "meta": { "page": 1, "limit": 10, "itemCount": 1, "pageCount": 1, "hasNextPage": false, "hasPreviousPage": false } }
```

## 8) `GET /loans/:id`

Loan detail including `employee` and the ordered `installments`. Unknown /
cross-tenant id → `404`.

## 9) `PATCH /loans/:id/approve`

Approve a **PENDING** loan and generate its monthly installment schedule in one
transaction (Company Owner). `200 OK` — returns the loan with `installments`.

Provide **exactly one** of `numberOfInstallments` or `installmentAmount`, plus
`startDate` (due date of the first installment; each following one is +1 month).

Body (by count):
```json
{ "numberOfInstallments": 6, "startDate": "2026-08-01" }
```
Body (by fixed amount — last installment absorbs any remainder):
```json
{ "installmentAmount": 2000, "startDate": "2026-08-01" }
```
| Field | Rules |
|-------|-------|
| `numberOfInstallments` | int 1–240, optional |
| `installmentAmount` | number > 0, ≤2 decimals, optional |
| `startDate` | ISO date string, required |

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Split by count | `{numberOfInstallments:6, startDate}` on a 12000 loan | `200`; 6 installments of `"2000"`; sum = total; `status:"APPROVED"` |
| ✅ S2 | Split by amount w/ remainder | `{installmentAmount:5000, startDate}` on 12000 | `200`; `["5000","5000","2000"]` (sum = total) |
| ✅ S3 | Amount ≥ total | `{installmentAmount:20000, startDate}` on 12000 | `200`; single installment of `"12000"` |
| 🟡 V1 | Neither field | `{startDate}` | `400` "exactly one of..." |
| 🟡 V2 | Both fields | `{numberOfInstallments:6, installmentAmount:2000, startDate}` | `400` "exactly one of..." |
| 🟡 V3 | Bad startDate | `startDate:"nope"` | `400` |
| 🟠 E1 | Re-approve | approve S1, then approve again | `409` "Only a PENDING loan can be approved" |
| 🔒 SEC1 | Non-owner token | `403` |

> Reconciliation check: `installments.reduce(+amount) === totalAmount` for every split strategy.

## 10) `DELETE /loans/:id`

Delete a loan (Company Owner) — allowed **only while PENDING**.
`200 OK` → `{ "success": true }`. Approved loan → `409`. Unknown / cross-tenant → `404`.

---

## Recommended APIDog test flow

1. Register **Company A**, create an employee `E`. Save `{{token_a}}` and `E.id`.
2. `POST /employees/E/salary-components` (Housing 1000) → `201`; add a percentage one → `201`.
3. `GET /employees/E/salary-components` → both listed.
4. `PATCH /salary-components/:id` (amount 1500) → `200`.
5. `POST /employees/E/loans` (`totalAmount:12000`) → `201` PENDING.
6. `PATCH /loans/:id/approve` (`numberOfInstallments:6, startDate`) → `200`; verify 6 × 2000 and `status:APPROVED`.
7. `GET /loans?status=APPROVED` → the loan appears.
8. `PATCH /loans/:id/approve` again → `409` (already approved).
9. Register **Company B** (`{{token_b}}`); `GET /loans/:id` with B → `404` (isolation).
