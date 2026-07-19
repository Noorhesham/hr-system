# E2E Master Test Plan — كل الـ Endpoints والـ Flows

**Base URL:** `http://localhost:3004/api`  
**Import:** `http://localhost:3004/docs-json` · Swagger: `http://localhost:3004/docs`  
**Cookie jar:** ON (للـ refresh/logout)

### Variables تقدّر تحفظها في APIDog
| Variable | منين |
|----------|------|
| `token_owner_a` | register/login شركة A |
| `token_owner_b` | register شركة B (عزل) |
| `token_emp` | login بـ portalCredentials |
| `companyId_a` | من `/auth/me` أو register |
| `shiftId` | POST /shifts |
| `employeeId` | POST /employees |
| `employeeId_daily` | موظف `salaryBasis:DAILY` |
| `employeeId_hourly` | موظف `salaryBasis:HOURLY` |
| `employeeId2` | موظف تاني |
| `docId` | POST documents |
| `compId` | salary-component |
| `loanId` | POST loan |
| `attId` | attendance record |
| `cycleId` | payroll cycle |
| `slipId` | payroll slip |

---

# FLOW 0 — إعداد

1. `npm run start:dev`
2. استورد `docs-json` من جديد
3. فعّل cookie jar

---

# FLOW 1 — Auth (شركة A ثم B)

## 1.1 Happy path — Company A
| # | Request | Body / Notes | Expected | ☐ |
|---|---------|--------------|----------|---|
| A1 | `POST /auth/register` | `{ "companyName":"Acme A", "email":"admin-a@test.com", "password":"Passw0rd!", "establishmentNumber":"1-111" }` | `201` + `accessToken` + user | |
| A2 | احفظ `token_owner_a` | من response | — | |
| A3 | `GET /auth/me` | Bearer A | `200`؛ `roleName:"Company Owner"`؛ `isPortalUser:false`؛ `employeeId:null` | |
| A4 | `POST /auth/change-password` | `{ "currentPassword":"Passw0rd!", "newPassword":"Passw0rd2!" }` | `200` + token جديد | |
| A5 | `POST /auth/login` | كلمة قديمة | `401` | |
| A6 | `POST /auth/login` | `{ "email":"admin-a@test.com", "password":"Passw0rd2!" }` | `200`؛ حدّث `token_owner_a` | |
| A7 | `POST /auth/refresh` | cookie فقط (مفيش Bearer) | `200` accessToken جديد | |
| A8 | `POST /auth/refresh` بالـ cookie **القديم** | بعد A7 | `401` (rotation) | |
| A9 | `POST /auth/logout` | Bearer الحالي | `200` `{success:true}` | |
| A10 | `POST /auth/refresh` بعد logout | | `401` | |
| A11 | `POST /auth/login` تاني | عشان نكمّل التيست | `200`؛ احفظ التوكن | |

## 1.2 Validation / Security
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| A12 | register إيميل غلط | `400` fieldErrors.email | |
| A13 | password ضعيف `abcdefg1` (من غير capital) | `400` | |
| A14 | register نفس إيميل A1 | `409` | |
| A15 | login باسورد غلط | `401` "Invalid email or password" | |
| A16 | login إيميل مش موجود | `401` **نفس الرسالة** (no enumeration) | |
| A17 | أي endpoint محمي من غير Bearer | `401` | |
| A18 | Bearer تالف `abc.def` | `401` | |
| A19 | body فيه field زيادة `"foo":1` على register | `400` forbidNonWhitelisted | |

## 1.3 Tenant B (للعزل)
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| A20 | `POST /auth/register` شركة B `admin-b@test.com` | `201`؛ `token_owner_b` | |
| A21 | `GET /auth/me` بتوكن B | `companyId` مختلف عن A | |

---

# FLOW 2 — Company Policy + Platform

## 2.1 Company (Owner A)
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| C1 | `GET /company/policy` | `200` defaults (GOSI 9.75/11.75, OT 1.5/2) | |
| C2 | `PATCH /company/policy` `{ "gosiNumber":"GOSI-A", "absenceMultiplierExcused":0.5, "delayDeductionType":"FIXED_AMOUNT" }` | `200`؛ القيم اتحدثت | |
| C3 | `PATCH` بقيمة سالبة `absenceMultiplierExcused:-1` | `400` | |
| C4 | `PATCH` نسبة >100 | `400` | |
| C5 | `PATCH` enum غلط | `400` | |
| C6 | `GET /company/policy` بتوكن B | مش شايف `GOSI-A` | |

## 2.2 Platform (محتاج isPlatformAdmin)
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| P1 | `GET /platform/settings` بتوكن Owner عادي | `403` | |
| P2 | من Prisma Studio: `isPlatformAdmin=true` على يوزر، ثم **login من جديد** | — | |
| P3 | `GET /platform/settings` | `200` singleton | |
| P4 | `PATCH /platform/settings` `{ "trialDays":30 }` | `200` | |
| P5 | `PATCH` `{ "trialDays":0 }` | `400` | |
| P6 | رجّع `isPortalAdmin=false` أو استخدم Owner تاني لباقي الفلو | — | |

> أو استخدم حساب الـ seed: `platform@admin.com` / `Platform@123` بعد `npx prisma db seed`.

---

# FLOW 3 — Shifts

| # | Request | Expected | ☐ |
|---|---------|----------|---|
| S1 | `POST /shifts` `{ "name":"Morning", "startTime":"08:00", "endTime":"17:00", "gracePeriodMinutes":15 }` | `201`؛ احفظ `shiftId` | |
| S2 | `GET /shifts` | فيه Morning | |
| S3 | `GET /shifts/:shiftId` | `200` | |
| S4 | `PATCH /shifts/:shiftId` `{ "gracePeriodMinutes":10 }` | `200` | |
| S5 | `POST /shifts` بوقت غلط `8:00` (من غير zero-pad لو الـ regex صارم) | `400` | |
| S6 | `GET /shifts/:id` بتوكن B | `404` | |
| S7 | `DELETE /shifts/:id` (وردية مش مستخدمة لاحقًا، أو اعمل وردية تانية واحذفها) | `200` | |

---

# FLOW 4 — Employees + Documents

## 4.1 Employees
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| E1 | `POST /employees` `{ "name":"Ahmed Ali", "email":"ahmed@acme.com", "basicSalary":5000, "salaryBasis":"MONTHLY", "shiftId":"{{shiftId}}", "isGosiRegistered":true, "gosiNumber":"1234567890" }` | `201` + `portalCredentials`؛ احفظ `employeeId` + email/password | |
| E1b | `POST /employees` يومي `{ "name":"Yousef Daily", "email":"yousef.daily@acme.com", "basicSalary":200, "salaryBasis":"DAILY", "shiftId":"{{shiftId}}", "employmentType":"TEMPORARY" }` | `201`؛ احفظ `employeeId_daily` | |
| E1c | `POST /employees` ساعة `{ "name":"Maha Hourly", "email":"maha.hourly@acme.com", "basicSalary":25, "salaryBasis":"HOURLY", "shiftId":"{{shiftId}}", "employmentType":"CONTRACT" }` | `201`؛ احفظ `employeeId_hourly` | |
| E2 | `POST /employees` بدون shiftId | `201` (مسموح؛ بس check-in هيفشل بعدين) | |
| E3 | `POST /employees` GOSI true من غير gosiNumber | `400` | |
| E4 | `POST /employees` إيميل مكرر | `409` | |
| E5 | `POST /employees` shiftId بتاع شركة B | `400` | |
| E6 | `GET /employees` | قائمة (فيها MONTHLY + DAILY + HOURLY) | |
| E7 | `GET /employees?search=Ahmed` | يلاقي أحمد | |
| E8 | `GET /employees/:employeeId` | `200`؛ `salaryBasis:"MONTHLY"` | |
| E8b | `GET /employees/:employeeId_daily` | `salaryBasis:"DAILY"`؛ `basicSalary:200` | |
| E8c | `GET /employees/:employeeId_hourly` | `salaryBasis:"HOURLY"`؛ `basicSalary:25` | |
| E9 | `PATCH /employees/:id` `{ "basicSalary":5500 }` | `200` | |
| E10 | `PATCH` `{ "shiftId":"{{shiftId}}" }` على موظف من غير وردية | `200` | |
| E11 | `GET /employees/:id` بتوكن B | `404` | |
| E12 | `POST /employees` بتوكن Employee portal | `403` | |

## 4.2 Documents
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| D1 | `POST /employees/:employeeId/documents` `{ "type":"NATIONAL_ID", "expiryDate":"2026-08-01", "documentNumber":"ID-1", "fileUrl":"https://example.com/id.pdf" }` | `201`؛ احفظ `docId` | |
| D2 | `GET /employees/:employeeId/documents` | فيه المستند | |
| D3 | `GET /documents/expiring?days=90` | يظهر لو قريب | |
| D4 | `GET /documents/expiring?days=1` | ممكن فاضي | |
| D5 | type غلط | `400` | |
| D6 | `DELETE /documents/:docId` | `{success:true}` | |
| D7 | document على employeeId بتاع B | `404` | |

---

# FLOW 5 — Attendance (أهم فلو)

**شرط:** الموظف لازم يكون عليه `shiftId`.  
**نافذة الـ live check-in:** من `startTime` لـ `endTime` فقط (مثلاً 08:00–17:00). قبل البداية أو بعد النهاية → `400`.  
استخدم حقل `at` عشان تختبر من غير ما تستنى الوقت الحقيقي.  
الـ Owner يقدر يكمّل سجلات قديمة بـ `POST /attendance` اليدوي (مش مربوط بالنافذة).

## 5.1 Owner punches for employee
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| T1 | check-in لموظف **من غير** وردية | `400` رسالة assign shift | |
| T2 | عيّن وردية `PATCH /employees/:id { "shiftId" }` | `200` | |
| T2a | check-in **قبل** بداية الشيفت `{ "employeeId", "at":"2026-07-15T07:30:00+03:00" }` (شيفت 08:00) | `400` too early | |
| T2b | check-in **بعد** نهاية الشيفت `{ "employeeId", "at":"2026-07-15T17:30:00+03:00" }` (شيفت ينتهي 17:00) | `400` shift has ended | |
| T3 | `POST /attendance/check-in` `{ "employeeId":"{{employeeId}}", "at":"2026-07-15T08:05:00+03:00" }` | `200` PRESENT؛ `shiftId` مش null؛ ممكن `delayMinutes>0` | |
| T4 | check-in تاني لنفس اليوم | `409` Already checked in | |
| T5 | `POST /attendance/check-out` `{ "employeeId":"{{employeeId}}", "at":"2026-07-15T17:30:00+03:00" }` | `200`؛ checkOut متسجل؛ OT لو بعد 17:00 | |
| T6 | check-out من غير check-in مفتوح | `409` | |
| T7 | Owner من غير `employeeId` في body | `400` employeeId required | |

## 5.2 Portal employee self punch
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| T8 | `POST /auth/login` بـ portalCredentials | `200`؛ `token_emp`؛ me فيه `employeeId` | |
| T9 | `POST /attendance/check-in` `{ "at":"2026-07-16T08:00:00+03:00" }` (يوم جديد داخل النافذة) | `200` لنفسه | |
| T9a | check-in بـ `at` قبل الشيفت | `400` | |
| T10 | check-in بـ employeeId **موظف تاني** | `403` only themselves | |
| T11 | `POST /attendance/check-out` `{ "at":"2026-07-16T17:00:00+03:00" }` | `200` | |

## 5.3 Manual + Bulk (Owner only)
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| T12 | `POST /attendance` LEAVE `{ "employeeId", "date":"2026-07-10", "status":"LEAVE" }` | `201/200` | |
| T13 | LEAVE مع checkIn | `422` | |
| T14 | PRESENT يدوي بأوقات + وردية (حتى لو برا نافذة الـ live punch) | `200` + metrics | |
| T15 | `POST /attendance/bulk` صفين (واحد OK وواحد employee غلط) | partial success report | |
| T16 | bulk كله فاشل | `422` + report | |
| T17 | `GET /attendance?employeeId=&dateFrom=&dateTo=` | قائمة | |
| T18 | `GET /attendance/:attId` | `200` | |
| T19 | `PATCH /attendance/:attId` صحّح وقت | يعيد حساب metrics | |
| T20 | manual/bulk/patch بتوكن Employee | `403` | |
| T21 | سجل شركة A بتوكن B | `404` | |
| T22 | Portal `GET /attendance` | يشوف سجلاته هو بس | |

## 5.4 حضور موظفي اليومية والساعة (للرواتب)
| # | Request | Expected | ☐ |
|---|---------|----------|---|
| T23 | يدوي: 3 أيام PRESENT لـ `employeeId_daily` في شهر التيست | `200` لكل يوم | |
| T24 | يدوي: يوم PRESENT لـ `employeeId_hourly` بـ checkIn 08:00 + checkOut 18:00 (9 ساعات عمل + OT≈1 لو الشيفت 8 ساعات) | `200`؛ `overtimeHours` > 0 | |
# FLOW 6 — Salary Components

| # | Request | Expected | ☐ |
|---|---------|----------|---|
| SC1 | `POST .../salary-components` Housing ALLOWANCE 1000 | `201`؛ احفظ `compId` | |
| SC2 | Transport 10% `isPercentage:true` | `201` | |
| SC3 | نسبة 150 | `400` | |
| SC4 | DEDUCTION ثابت 100 | `201` | |
| SC5 | `GET .../salary-components` | القائمة | |
| SC6 | `PATCH /salary-components/:compId` `{ "amount":1500 }` | `200` | |
| SC7 | اقلب لـ percentage ومبلغ >100 | `400` | |
| SC8 | `DELETE /salary-components/:id` (اعمل واحد زيادة واحذفه) | `{success:true}` | |
| SC9 | cross-tenant | `404` | |
| SC10 | write بتوكن Employee | `403` | |

---

# FLOW 7 — Loans

| # | Request | Expected | ☐ |
|---|---------|----------|---|
| L1 | `POST .../loans` `{ "totalAmount":12000 }` | `201` PENDING؛ احفظ `loanId` | |
| L2 | `totalAmount:0` | `400` | |
| L3 | `PATCH /loans/:id/approve` `{ "numberOfInstallments":6, "startDate":"2026-08-01" }` | `200` APPROVED؛ 6×2000 | |
| L4 | مجموع الأقساط = 12000 | لازم يطابق | |
| L5 | approve بـ `installmentAmount:5000` على قرض جديد 12000 | أقساط 5000+5000+2000 | |
| L6 | لا count ولا amount | `400` | |
| L7 | الاتنين مع بعض | `400` | |
| L8 | approve تاني لنفس القرض | `409` | |
| L9 | `DELETE` قرض APPROVED | `409` | |
| L10 | قرض PENDING جديد ثم `DELETE` | `{success:true}` | |
| L11 | `GET /loans` و `GET /loans/:id` و `GET .../employees/:id/loans` | `200` | |
| L12 | cross-tenant | `404` | |

**لفلو الرواتب:** خلّي قرض APPROVED أقساطه `dueDate` جوه شهر التيست (مثلاً الشهر الحالي).

---

# FLOW 8 — Payroll (كامل)

حضّر قبلها لنفس الشهر:
- موظف نشط MONTHLY + وردية + حضور (تأخير/غياب/OT لو عايز)
- موظف DAILY بـ ≥ يوم PRESENT (من T23)
- موظف HOURLY بـ PRESENT + checkIn/Out (من T24)
- بدلات/خصومات
- قسط سلفة مستحق في نفس الشهر

| # | Request | Expected | ☐ |
|---|---------|----------|---|
| R1 | `POST /payroll/cycles` `{ "month":7, "year":2026 }` | `201/200` DRAFT + slips؛ احفظ `cycleId` + `slipId` | |
| R2 | نفس الشهر تاني | `409` already exists | |
| R3 | `GET /payroll/cycles` | القائمة | |
| R4 | `GET /payroll/cycles/:cycleId` | slips جوا (MONTHLY + DAILY + HOURLY) | |
| R5 | `GET /payroll/slips/:slipId` | تفاصيل | |
| R6 | MONTHLY: أساسي+بدلات+OT − خصومات−غياب−تأخير−GOSI−سلفة ≥ 0 | منطقي | |
| R6b | DAILY: `basicSalary` على الـ slip ≈ `200 × عدد أيام PRESENT` (مش 200 كشهر) | صح | |
| R6c | HOURLY: `basicSalary` ≈ `25 × ساعات منتظمة`؛ OT منفصل في `overtimeBonus` | صح | |
| R7 | `POST .../recalculate` | DRAFT؛ أرقام تتحدث | |
| R8 | `PATCH .../review` | REVIEW | |
| R9 | `recalculate` وهو REVIEW | `409` | |
| R10 | `PATCH .../approve` | APPROVED؛ أقساط → DEDUCTED | |
| R11 | `GET .../wps` | CSV download | |
| R12 | `PATCH .../close` | CLOSED | |
| R13 | `approve` بعد CLOSE | `409` | |
| R14 | WPS وهو DRAFT | `409` | |
| R15 | payroll write بتوكن Employee | `403` | |
| R16 | cycle شركة A بتوكن B | `404` | |
| R17 | شهر من غير موظفين نشطين | `422` | |

---

# FLOW 9 — ESS (موظف)

Login: `token_emp` من portalCredentials.

| # | Request | Expected | ☐ |
|---|---------|----------|---|
| ES1 | `GET /ess/me` | profile + shift + company | |
| ES2 | `GET /ess/salary-components` | بدلاته | |
| ES3 | `GET /ess/documents` | مستنداته | |
| ES4 | `GET /ess/attendance` | حضوره | |
| ES5 | `GET /ess/loans` | سلفه | |
| ES6 | `GET /ess/payslips` | فاضي قبل APPROVE؛ فيه بعد APPROVE/CLOSE | |
| ES7 | `GET /ess/payslips/:slipId` | `200` بعد الاعتماد | |
| ES8 | payslip لموظف تاني / DRAFT | `404` | |
| ES9 | أي `/ess/*` بتوكن Owner | `403` Insufficient role | |

---

# FLOW 10 — Reports (Owner)

| # | Request | Expected | ☐ |
|---|---------|----------|---|
| RP1 | `GET /reports/dashboard` | أعداد موظفين/سلف/دورات | |
| RP2 | `GET /reports/payroll-summary?month=7&year=2026` | totals | |
| RP3 | `GET /reports/attendance-summary?month=7&year=2026` | present/absent/leave | |
| RP4 | `GET /reports/gosi?month=7&year=2026` | أسهم GOSI | |
| RP5 | شهر مفيش له cycle | `404` على payroll-summary/gosi | |
| RP6 | reports بتوكن Employee | `403` | |

---

# FLOW 11 — Cross-cutting (لازم يعدّي)

| # | Scenario | Expected | ☐ |
|---|----------|----------|---|
| X1 | كل GET/PATCH على موارد A بتوكن B | `404` (مش `403` يفضح الوجود) حيث مطبق | |
| X2 | Owner endpoints بـ Employee token | `403` | |
| X3 | ESS بـ Owner token | `403` | |
| X4 | بدون Authorization | `401` | |
| X5 | unknown JSON field | `400` | |
| X6 | بعد logout التوكن/الريفرش | `401` على refresh | |

---

# ترتيب تشغيل مقترح (جلسة واحدة ~45–60 دقيقة)

```
1  Auth A + B + isolation          (Flow 1)
2  Policy (+ Platform optional)    (Flow 2)
3  Shift → Employee → Documents    (Flow 3–4)
4  Attendance Owner + Portal       (Flow 5)
5  Salary components + Loan        (Flow 6–7)
6  Payroll full lifecycle + WPS    (Flow 8)
7  ESS payslips                    (Flow 9)
8  Reports                         (Flow 10)
9  Cross-cutting spot checks       (Flow 11)
```

---

# فهرس سريع — كل الـ Endpoints الموجودة

| Method | Path |
|--------|------|
| POST | `/auth/register` `/auth/login` `/auth/refresh` `/auth/logout` `/auth/change-password` |
| GET | `/auth/me` |
| GET/PATCH | `/company/policy` |
| GET/PATCH | `/platform/settings` |
| CRUD | `/employees` `/employees/:id` |
| | `/employees/:id/documents` · `/documents/expiring` · `DELETE /documents/:id` |
| CRUD | `/shifts` `/shifts/:id` |
| | `/attendance/check-in` `/check-out` `POST /attendance` `/bulk` `GET` `GET/:id` `PATCH/:id` |
| | `/employees/:id/salary-components` · `PATCH/DELETE /salary-components/:id` |
| | `/employees/:id/loans` · `/loans` · `/loans/:id` · `/loans/:id/approve` · `DELETE /loans/:id` |
| | `/payroll/cycles` … `/recalculate` `/review` `/approve` `/close` `/wps` · `/payroll/slips/:id` |
| | `/ess/me` `/salary-components` `/documents` `/attendance` `/loans` `/payslips` `/payslips/:id` |
| | `/reports/dashboard` `/payroll-summary` `/attendance-summary` `/gosi` |

**مش موجودين (متوقع يفشلوا لو جربتهم):** 2FA، forgot-password، Excel import، Leave APIs، OT-request APIs، PDF export.
