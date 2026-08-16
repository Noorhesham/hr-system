const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SYSTEM_ROLE_PERMISSIONS = {
  HR: [
    'CREATE_EMPLOYEE',
    'UPDATE_EMPLOYEE',
    'VIEW_EMPLOYEE',
    'MANAGE_ATTENDANCE',
    'MANAGE_LOANS',
    'MANAGE_SHIFTS',
    'MANAGE_DOCUMENTS',
    'MANAGE_LEAVES',
    'APPROVE_LEAVES',
    'MANAGE_REQUESTS',
    'APPROVE_REQUESTS',
    'MANAGE_DEPARTMENTS',
    'VIEW_REPORTS',
    'VIEW_ROLES',
  ],
  Manager: [
    'VIEW_EMPLOYEE',
    'APPROVE_LEAVES',
    'APPROVE_REQUESTS',
    'MANAGE_ATTENDANCE',
  ],
  Payroll: ['VIEW_EMPLOYEE', 'MANAGE_PAYROLL', 'VIEW_REPORTS', 'MANAGE_LOANS'],
};

(async () => {
  const companies = await p.company.findMany({ select: { id: true, name: true } });
  const permissions = await p.permission.findMany({
    select: { id: true, action: true },
  });
  const byAction = new Map(permissions.map((x) => [x.action, x.id]));

  for (const c of companies) {
    const owner = await p.role.findUnique({
      where: { companyId_name: { companyId: c.id, name: 'Company Owner' } },
    });
    if (owner) {
      await p.role.update({
        where: { id: owner.id },
        data: { permissions: { set: permissions.map((x) => ({ id: x.id })) } },
      });
    }
    for (const [name, actions] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
      const ids = actions
        .map((a) => byAction.get(a))
        .filter(Boolean);
      const r = await p.role.upsert({
        where: { companyId_name: { companyId: c.id, name } },
        update: {},
        create: {
          companyId: c.id,
          name,
          permissions: { connect: ids.map((id) => ({ id })) },
        },
      });
      await p.role.update({
        where: { id: r.id },
        data: { permissions: { set: ids.map((id) => ({ id })) } },
      });
    }
    console.log('ok', c.name);
  }
  await p.$disconnect();
})();
