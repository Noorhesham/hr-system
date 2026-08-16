import type { Prisma, PrismaClient } from '@prisma/client';
import {
  COMPANY_OWNER_ROLE,
  EMPLOYEE_ROLE,
  HR_ROLE,
  MANAGER_ROLE,
  PAYROLL_ROLE,
} from '../constants/roles.constant';
import {
  SYSTEM_ROLE_PERMISSIONS,
} from '../constants/permissions.constant';

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Ensures Owner / Employee / HR / Manager / Payroll exist for a company and
 * have the correct permission sets. Idempotent — safe on re-seed / register.
 */
export async function provisionSystemRoles(
  db: DbClient,
  companyId: string,
): Promise<{ ownerRoleId: string }> {
  const allPerms = await db.permission.findMany({ select: { id: true, action: true } });
  const byAction = new Map(allPerms.map((p) => [p.action, p.id]));

  const owner = await db.role.upsert({
    where: { companyId_name: { companyId, name: COMPANY_OWNER_ROLE } },
    update: {},
    create: {
      companyId,
      name: COMPANY_OWNER_ROLE,
      permissions: { connect: allPerms.map((p) => ({ id: p.id })) },
    },
  });
  await db.role.update({
    where: { id: owner.id },
    data: { permissions: { set: allPerms.map((p) => ({ id: p.id })) } },
  });

  await db.role.upsert({
    where: { companyId_name: { companyId, name: EMPLOYEE_ROLE } },
    update: {},
    create: { companyId, name: EMPLOYEE_ROLE },
  });

  for (const [name, actions] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
    const ids = actions
      .map((a) => byAction.get(a))
      .filter((id): id is string => Boolean(id));
    const role = await db.role.upsert({
      where: { companyId_name: { companyId, name } },
      update: {},
      create: {
        companyId,
        name,
        permissions: { connect: ids.map((id) => ({ id })) },
      },
    });
    await db.role.update({
      where: { id: role.id },
      data: { permissions: { set: ids.map((id) => ({ id })) } },
    });
  }

  // Touch constants so tree-shaking keeps role name exports used.
  void HR_ROLE;
  void MANAGER_ROLE;
  void PAYROLL_ROLE;

  return { ownerRoleId: owner.id };
}
