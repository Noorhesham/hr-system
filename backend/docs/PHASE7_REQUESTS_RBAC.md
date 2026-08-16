# Phase 7 API Spec — Requests, Notifications & RBAC

Base: `http://localhost:3004/api`  
Swagger: `http://localhost:3004/docs`

## Permissions (JWT + `/auth/me`)

Access tokens and `GET /auth/me` include `permissions: string[]` from the user's role.
**Company Owner** bypasses `@Permissions` checks in `PermissionsGuard`.

New catalog actions (in addition to Phase 1–6):

| Action | Typical use |
|--------|-------------|
| `MANAGE_LEAVES` / `APPROVE_LEAVES` | Leave admin / HR |
| `MANAGE_REQUESTS` / `APPROVE_REQUESTS` | OT & general requests |
| `MANAGE_ROLES` / `VIEW_ROLES` | Roles UI |
| `MANAGE_DEPARTMENTS` | Departments CRUD |

System roles provisioned on register / seed: **Company Owner**, **Employee**, **HR**, **Manager**, **Payroll**.

## Roles

| Method | Path | Permission |
|--------|------|------------|
| GET | `/permissions` | VIEW_ROLES or MANAGE_ROLES |
| GET | `/roles` | VIEW_ROLES or MANAGE_ROLES |
| GET | `/roles/users` | MANAGE_ROLES |
| POST | `/roles` | MANAGE_ROLES |
| PATCH | `/roles/:id` | MANAGE_ROLES |
| DELETE | `/roles/:id` | MANAGE_ROLES |
| PATCH | `/users/:userId/role` | MANAGE_ROLES |

Owner/Employee names cannot be deleted; Owner permissions cannot be changed.

## Employee requests (OT + GENERAL)

Two-level approval: **direct manager (L1)** → **HR / Owner with APPROVE_REQUESTS (L2)**.  
Owner approving at L1 finalizes immediately. Leave remains on `/leaves`.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/requests` | Self (or admin with employeeId) |
| GET | `/requests?mine=1` | My requests (portal always mine) |
| GET | `/requests` | Inbox (manager / HR / Owner) |
| GET | `/requests/:id` | Detail + approval steps |
| PATCH | `/requests/:id/approve` | L1 or L2 |
| PATCH | `/requests/:id/reject` | Optional `reviewNote` |
| DELETE | `/requests/:id` | Cancel PENDING only |

Statuses: `PENDING` → `IN_REVIEW` → `APPROVED` | `REJECTED` | `CANCELLED`.

## Notifications

| Method | Path |
|--------|------|
| GET | `/notifications` |
| PATCH | `/notifications/:id/read` |
| POST | `/notifications/read-all` |

Events: submit → manager/owners; L1 approve → HR/owners; final approve/reject → employee (+ email log).

## Frontend routes

| Route | Purpose |
|-------|---------|
| `/my-requests` | Employee create + list |
| `/requests` | Admin/manager inbox |
| `/roles` | Roles matrix + assign user role |

## Out of scope (still later)

- PDF payslips / Excel reports UI
- Configurable per-type approval chains
- Multi-role per user
- Merging Leave into `EmployeeRequest`
