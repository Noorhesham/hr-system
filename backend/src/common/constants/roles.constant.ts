/**
 * Name of the tenant's built-in full-access role, created for the admin user at
 * registration. This is a PER-COMPANY role (the company owner) — distinct from
 * the platform-level superuser (`User.isPlatformAdmin`), which is the SaaS
 * operator with cross-tenant, all-access rights.
 */
export const COMPANY_OWNER_ROLE = 'Company Owner';

/**
 * Limited per-company role assigned to auto-created employee **portal** accounts
 * (`isPortalUser = true`). Can self check-in/out; full ESS (payslips, leave
 * requests, …) lands in Phase 6.
 */
export const EMPLOYEE_ROLE = 'Employee';
