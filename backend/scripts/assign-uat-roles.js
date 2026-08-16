/**
 * Assign known Najd seed employees to HR / Manager / Payroll for UAT.
 * Passwords stay Emp@12345 (seed).
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const NAJD = 'seed-najd-trading';

const ASSIGN = [
  { email: 'fatima.qahtani@najd.sa', role: 'HR' },
  { email: 'ahmed.harbi@najd.sa', role: 'Manager' },
  { email: 'omar.zahrani@najd.sa', role: 'Payroll' },
];

(async () => {
  for (const row of ASSIGN) {
    const user = await p.user.findUnique({
      where: { email: row.email },
      select: { id: true, companyId: true, email: true },
    });
    if (!user) {
      console.log('missing user', row.email);
      continue;
    }
    const role = await p.role.findUnique({
      where: {
        companyId_name: { companyId: user.companyId, name: row.role },
      },
    });
    if (!role) {
      console.log('missing role', row.role, 'for', user.companyId);
      continue;
    }
    await p.user.update({
      where: { id: user.id },
      data: { roleId: role.id, isPortalUser: false },
    });
    console.log(`✓ ${row.email} → ${row.role}`);
  }
  await p.$disconnect();
})();
