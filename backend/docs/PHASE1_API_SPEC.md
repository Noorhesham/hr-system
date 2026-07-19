# Phase 1 API Spec — Core, Auth & Settings

API reference for **APIDog / Postman**. Covers:
`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
`POST /auth/logout`, `GET /company/policy`, `PATCH /company/policy`.

---

## Conventions

| Item | Value |
|------|-------|
| Base URL (dev) | `http://localhost:3004/api` (global `/api` prefix, port 3004) |
| Content type | `application/json` |
| Auth scheme | `Authorization: Bearer <accessToken>` |
| Access token TTL | `JWT_EXPIRY` (default `15m`) |
| Access JWT claims | `sub` (= userId), `email`, `companyId`, `roleId`, `roleName`, `isPlatformAdmin` |
| Refresh token | httpOnly cookie **`refreshToken`** (path `/auth`), TTL `JWT_REFRESH_EXPIRY` (default `30d`), **rotated** on every `/auth/refresh` and revoked on `/auth/logout` |
| Authorization (RBAC) | `PATCH /company/policy` → **Company Owner** role (`roleName`); `/platform/*` → **platform admin** (`isPlatformAdmin`). Otherwise `403`. |

> Endpoint paths below are relative to the base URL, e.g. `POST /auth/register` → `http://localhost:3004/api/auth/register`.

> **APIDog/Postman tip:** enable the cookie jar ("send cookies automatically").
> `register` / `login` / `refresh` return `Set-Cookie: refreshToken=...; HttpOnly; Path=/auth`. Because the cookie path is `/auth`, it is only sent to `/auth/*` routes.

### Standard error envelope
Every error (from the global `AllExceptionsFilter`) looks like:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "fieldErrors": { "email": "email must be an email" },
  "timestamp": "2026-06-27T10:00:00.000Z",
  "path": "/auth/register"
}
```
- `fieldErrors` is present **only** for body-validation failures (one message per invalid field).
- Validation is strict: unknown body properties are rejected (`forbidNonWhitelisted`).

### Prerequisites (server side, run once)
1. `npx prisma migrate dev` — create/upgrade tables in Neon (includes `User.refreshTokenHash`).
2. *(Recommended)* Seed global `Permission` rows and at least one `SubscriptionPlan`.
   - Without permissions, the `Super Admin` role is created with an **empty** permission set (still valid).
   - A company is created **without a plan** unless `planId` is supplied (it stays on `TRIAL`).

---

## 1) `POST /auth/register`

Provisions a new tenant in a single transaction: **Company → CompanyPolicy → `Super Admin` Role (all permissions) → admin User**. Then issues the first token pair.

### Request
| | |
|---|---|
| Method | `POST` |
| URL | `/auth/register` |
| Auth | None (public) |
| Headers | `Content-Type: application/json` |
| Rate limit | 5 requests / 60s per IP |

Body:
```json
{
  "companyName": "Acme Operations",
  "email": "admin@acme.com",
  "password": "Passw0rd!",
  "establishmentNumber": "1-2345678",
  "planId": "OPTIONAL_PLAN_UUID"
}
```
| Field | Rules |
|-------|-------|
| `companyName` | string, required, ≤120 chars |
| `email` | valid email, required, globally unique |
| `password` | string, 8–72 chars, must contain lower + upper + digit |
| `establishmentNumber` | string, optional, ≤50 |
| `planId` | string (uuid), optional — **omit to create the company with no plan** (stays on TRIAL); if provided it must reference an existing plan |

### Success — `201 Created`
Body (the refresh token is **not** in the body — it's in the cookie):
```json
{
  "accessToken": "eyJ...",
  "user": { "userId": "uuid", "email": "admin@acme.com", "companyId": "uuid", "roleId": "uuid" }
}
```
Response header: `Set-Cookie: refreshToken=eyJ...; HttpOnly; Path=/auth; SameSite=Lax`.

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Valid registration | full valid body | `201`; `accessToken` present; `refreshToken` cookie set |
| ✅ S2 | **No plan** | omit `planId` | `201`; company created, `planId = null` |
| ✅ S3 | With a valid plan | `planId` = seeded plan id | `201` |
| 🟡 V1 | Invalid email | `email:"acme.com"` | `400`; `fieldErrors.email` |
| 🟡 V2 | Missing password | omit `password` | `400`; `fieldErrors.password` |
| 🟡 V3 | Weak password | `password:"alllowercase"` | `400` (needs upper+digit) |
| 🟡 V4 | Short password | `password:"Ab1"` | `400` |
| 🟡 V5 | Missing companyName | omit `companyName` | `400`; `fieldErrors.companyName` |
| 🟡 V6 | Unknown property | add `"isAdmin": true` | `400` (forbidNonWhitelisted) |
| 🟠 E1 | **Duplicate email** | register S1 body twice | 2nd → `409` "Email is already registered" |
| 🟠 E2 | Non-existent `planId` | random uuid | `400` "The selected subscription plan does not exist" |
| 🔒 R1 | Rate limit | 6 calls within 60s | 6th → `429` |

> **Atomicity check:** with E2 (bad planId), confirm no orphan Company/Role/User exists for that email — the plan check runs before the `$transaction`, so nothing is created.

---

## 2) `POST /auth/login`

### Request
| | |
|---|---|
| Method | `POST` |
| URL | `/auth/login` |
| Auth | None (public) |
| Headers | `Content-Type: application/json` |
| Rate limit | 10 requests / 60s per IP |

Body:
```json
{ "email": "admin@acme.com", "password": "Passw0rd!" }
```

### Success — `200 OK`
```json
{
  "accessToken": "eyJ...",
  "user": { "userId": "uuid", "email": "admin@acme.com", "companyId": "uuid", "roleId": "uuid" }
}
```
Also sets the `refreshToken` httpOnly cookie.

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Valid login | correct creds | `200`; `accessToken` + refresh cookie |
| 🟡 V1 | Invalid email format | `email:"nope"` | `400`; `fieldErrors.email` |
| 🟡 V2 | Missing password | omit `password` | `400`; `fieldErrors.password` |
| 🔒 SEC1 | Wrong password | valid email, bad password | `401` "Invalid email or password" |
| 🔒 SEC2 | Unknown email | unregistered email | `401`; **same** message as SEC1 (no user enumeration) |
| 🔒 R1 | Rate limit | 11 calls within 60s | 11th → `429` |

> Save `accessToken` to an env var (e.g. `{{token_a}}`) for the company endpoints.

---

## 3) `POST /auth/refresh`

Exchanges a valid refresh **cookie** for a new token pair. Rotation: the new refresh token replaces the old one server-side, so the previous refresh token stops working.

### Request
| | |
|---|---|
| Method | `POST` |
| URL | `/auth/refresh` |
| Auth | **Refresh cookie** `refreshToken` (no `Authorization` header needed) |
| Body | none |

### Success — `200 OK`
```json
{ "accessToken": "eyJ...new..." }
```
Also sets a **new** `refreshToken` cookie (rotation).

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Valid refresh | with cookie from login | `200`; new `accessToken`; new refresh cookie |
| 🔒 SEC1 | No cookie | call without cookie | `401` |
| 🔒 SEC2 | Tampered cookie | edit a char in the cookie | `401` (signature fails) |
| 🔒 SEC3 | **Rotation** | call S1, then call again with the **old** cookie value | old token → `401` (hash already rotated) |
| 🔒 SEC4 | After logout | logout, then refresh with that cookie | `401` (hash cleared) |

---

## 4) `POST /auth/logout`

Revokes the session: clears `User.refreshTokenHash` and the cookie.

### Request
| | |
|---|---|
| Method | `POST` |
| URL | `/auth/logout` |
| Auth | **Required** — `Authorization: Bearer {{token_a}}` |
| Body | none |

### Success — `200 OK`
```json
{ "success": true }
```
Sends `Set-Cookie` clearing `refreshToken`.

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Valid logout | valid access token | `200`; `{ "success": true }` |
| 🔒 SEC1 | No token | (none) | `401` |
| 🔒 SEC2 | Refresh after logout | logout, then `POST /auth/refresh` | `401` (see Refresh SEC4) |

---

## 5) `GET /company/policy`

Returns the **calling tenant's** policy. `companyId` comes from the JWT, never from the client.

### Request
| | |
|---|---|
| Method | `GET` |
| URL | `/company/policy` |
| Auth | **Required** — `Authorization: Bearer {{token_a}}` |
| Guards | `JwtAuthGuard` + `TenantGuard` |

### Success — `200 OK`
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "delayDeductionType": "PER_MINUTE",
  "absenceMultiplierUnexcused": "1",
  "absenceMultiplierExcused": "1",
  "overtimeMultiplierNormal": "1.5",
  "overtimeMultiplierHoliday": "2",
  "gosiEmployeePercentage": "9.75",
  "gosiCompanyPercentage": "11.75",
  "gosiNumber": null,
  "defaultWeekendDays": ["FRIDAY", "SATURDAY"],
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z"
}
```
> Decimal fields serialize as strings (Prisma `Decimal`).

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Valid token | `Bearer {{token_a}}` | `200`; `companyId` matches token's company |
| 🔒 SEC1 | No Authorization header | (none) | `401` Unauthorized |
| 🔒 SEC2 | Malformed token | `Bearer abc.def` | `401` |
| 🔒 SEC3 | Expired token | token past `JWT_EXPIRY` | `401` |
| 🔒 T1 | **Tenant isolation** | call with `{{token_b}}` | `200`; returns **B's** policy, never A's |

---

## 6) `PATCH /company/policy`

Partial update of the calling tenant's policy (send only the fields you change).

### Request
| | |
|---|---|
| Method | `PATCH` |
| URL | `/company/policy` |
| Auth | **Required** — `Authorization: Bearer {{token_a}}` |
| Headers | `Content-Type: application/json` |
| Guards | `JwtAuthGuard` + `TenantGuard` + `RolesGuard` |
| Role | **Company Owner only** (`@Roles('Company Owner')`) → others `403` |

Body (all fields optional):
```json
{
  "delayDeductionType": "FIXED_AMOUNT",
  "absenceMultiplierUnexcused": 1.0,
  "absenceMultiplierExcused": 0.5,
  "overtimeMultiplierNormal": 1.5,
  "overtimeMultiplierHoliday": 2.0,
  "gosiEmployeePercentage": 9.75,
  "gosiCompanyPercentage": 11.75,
  "gosiNumber": "GOSI-99887",
  "defaultWeekendDays": ["FRIDAY", "SATURDAY"]
}
```
| Field | Rules |
|-------|-------|
| `delayDeductionType` | enum: `PER_MINUTE` \| `FIXED_AMOUNT` |
| `absence*` / `overtime*` multipliers | number, 0–10, ≤2 decimals |
| `gosi*Percentage` | number, 0–100, ≤2 decimals |
| `gosiNumber` | string, ≤50 |
| `defaultWeekendDays` | non-empty array of strings |

### Success — `200 OK`
Returns the full updated policy (same shape as GET).

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Valid partial update | `{ "gosiEmployeePercentage": 10.5 }` | `200`; value updated, others unchanged |
| ✅ S2 | Update weekend days | `{ "defaultWeekendDays": ["FRIDAY"] }` | `200` |
| ✅ S3 | Change enum | `{ "delayDeductionType": "FIXED_AMOUNT" }` | `200` |
| 🟡 V1 | Non-numeric percentage | `{ "gosiEmployeePercentage": "abc" }` | `400` |
| 🟡 V2 | Negative multiplier | `{ "absenceMultiplierExcused": -1 }` | `400` (Min 0) |
| 🟡 V3 | Percentage > 100 | `{ "gosiCompanyPercentage": 150 }` | `400` (Max 100) |
| 🟡 V4 | Too many decimals | `{ "overtimeMultiplierNormal": 1.999 }` | `400` (maxDecimalPlaces 2) |
| 🟡 V5 | Empty weekend array | `{ "defaultWeekendDays": [] }` | `400` (ArrayNotEmpty) |
| 🟡 V6 | Invalid enum | `{ "delayDeductionType": "WEEKLY" }` | `400` |
| 🟡 V7 | Unknown / spoofed field | `{ "companyId": "other-uuid" }` | `400` (forbidNonWhitelisted — companyId can't be set from body) |
| 🔒 SEC1 | No token | (none) | `401` |
| 🔒 T1 | **Cross-tenant write** | update with `{{token_a}}`, then GET with `{{token_b}}` | A changes; **B unchanged** |

---

## 7) `GET` / `PATCH /platform/settings`  *(Platform admin)*

Global platform defaults applied to TRIAL / no-plan companies. These are
**global** (affect every tenant), so they require a platform-level superuser
(`isPlatformAdmin` on the User) — NOT a tenant role like Company Owner.

| | |
|---|---|
| Methods / URL | `GET /platform/settings`, `PATCH /platform/settings` |
| Auth | **Required** — Bearer, **platform admin** (`isPlatformAdmin`) |
| Guards | `JwtAuthGuard` + `PlatformAdminGuard` |

GET success — `200 OK`:
```json
{ "id": "global", "defaultTrialMaxEmployees": 10, "trialDays": 14, "createdAt": "...", "updatedAt": "..." }
```
PATCH body (all optional):
```json
{ "defaultTrialMaxEmployees": 25, "trialDays": 30 }
```

### Test cases
| # | Scenario | Request | Expected |
|---|----------|---------|----------|
| ✅ S1 | Read settings | Super Admin token | `200`; singleton (auto-created on first read) |
| ✅ S2 | Update settings | `{ "trialDays": 30 }` | `200`; new registrations then get a 30-day trial |
| 🟡 V1 | Below minimum | `{ "trialDays": 0 }` | `400` (Min 1) |
| 🟡 V2 | Non-integer | `{ "defaultTrialMaxEmployees": 5.5 }` | `400` (IsInt) |
| 🔒 SEC1 | No token | (none) | `401` |
| 🔒 SEC2 | Non platform-admin | a freshly registered Company Owner token | `403` Platform admin access required |

> A new `register` user is a **Company Owner**, not a platform admin — so this
> `403` is easy to reproduce. Set `isPlatformAdmin = true` (e.g. via
> `npx prisma studio`) and re-login to get a `200`.

---

## Recommended APIDog test flow

1. `POST /auth/register` → **Company A** (`admin@a.com`). Save `accessToken` → `{{token_a}}`; cookie jar stores A's refresh cookie.
2. `POST /auth/register` → **Company B** (`admin@b.com`). Save `accessToken` → `{{token_b}}`.
3. `GET /company/policy` with `{{token_a}}` → note A's `companyId`.
4. `GET /company/policy` with `{{token_b}}` → confirm a **different** `companyId`.
5. `PATCH /company/policy` with `{{token_a}}` `{ "gosiNumber": "A-ONLY" }` → `200`.
6. `GET /company/policy` with `{{token_b}}` → `gosiNumber` is **not** `A-ONLY` (isolation holds).
7. `POST /auth/refresh` (A's cookie) → `200` new `accessToken`; then refresh again with the **old** cookie → `401` (rotation).
8. `POST /auth/logout` with `{{token_a}}` → `200`; then `POST /auth/refresh` → `401` (revoked).
9. `GET /company/policy` with **no** header → `401` (auth enforced).
