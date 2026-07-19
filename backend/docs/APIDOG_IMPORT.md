# Importing the API into APIDog / Swagger

## Links (server must be running)

| What | URL |
|------|-----|
| **OpenAPI JSON (APIDog import)** | **`http://localhost:3004/docs-json`** |
| **Swagger UI** | **`http://localhost:3004/docs`** |
| Base API | `http://localhost:3004/api` |
| Static file | `backend/openapi.json` (`npm run openapi:export`) |
| Postman collection | `backend/postman_collection.json` (`npm run postman:export`) |

```bash
cd backend
npm run start:dev
# then open http://localhost:3004/docs
# or APIDog → Import → OpenAPI → URL → http://localhost:3004/docs-json
```

Re-import / refresh after pulling new phases so new folders appear (Payroll, ESS, Reports).

---

## Folders (all phases)

| Folder | Phase |
|--------|-------|
| Auth, Company, Platform | 1 |
| Employees, Documents | 2 |
| Shifts, Attendance | 3 |
| Salary Components, Loans | 4 |
| **Payroll** | **5** |
| **ESS**, **Reports** | **6** |

---

## Recommended end-to-end test

### As Company Owner
1. `POST /auth/register` (or login)
2. `POST /shifts` → save `shiftId`
3. `POST /employees` with `shiftId` → save `employeeId` + `portalCredentials`
4. Salary components + approve a loan with installments due this month
5. Attendance check-in/out (or bulk) for that employee
6. `POST /payroll/cycles` `{ "month": 7, "year": 2026 }`
7. `PATCH /payroll/cycles/:id/review` → `approve` → `close`
8. `GET /payroll/cycles/:id/wps` (CSV download)
9. `GET /reports/dashboard` + `payroll-summary`

### As Employee (portal)
1. `POST /auth/login` with `portalCredentials`
2. `GET /ess/me`
3. `POST /attendance/check-in` with `at` inside the shift window (e.g. between startTime and endTime); outside window → `400`
4. `POST /attendance/check-out` (allowed after end for OT)
4. `GET /ess/payslips` (after Owner approved the cycle)

Enable APIDog **cookie jar** for `/auth/refresh`.

---

## Spec docs

| Doc | Path |
|-----|------|
| **E2E Master (كل الـ endpoints + test cases)** | [`E2E_MASTER_TEST_PLAN.md`](./E2E_MASTER_TEST_PLAN.md) |
| Phase 1 | [`PHASE1_API_SPEC.md`](./PHASE1_API_SPEC.md) |
| Phase 4 | [`PHASE4_API_SPEC.md`](./PHASE4_API_SPEC.md) |
| Phase 5 | [`PHASE5_API_SPEC.md`](./PHASE5_API_SPEC.md) |
| Phase 6 | [`PHASE6_API_SPEC.md`](./PHASE6_API_SPEC.md) |
