const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const users = await p.user.findMany({
    where: { isPlatformAdmin: false },
    select: {
      email: true,
      fullName: true,
      isPortalUser: true,
      company: { select: { name: true, id: true } },
      role: { select: { name: true } },
    },
    orderBy: [{ companyId: 'asc' }, { email: 'asc' }],
  });

  const byRole = {};
  for (const u of users) {
    const r = u.role.name;
    if (!byRole[r]) byRole[r] = [];
    byRole[r].push({
      email: u.email,
      fullName: u.fullName,
      company: u.company.name,
      companyId: u.company.id,
      portal: u.isPortalUser,
    });
  }

  for (const [role, list] of Object.entries(byRole).sort()) {
    console.log(`\n=== ${role} (${list.length}) ===`);
    for (const row of list.slice(0, 12)) {
      console.log(
        `  ${row.email} | ${row.fullName || '-'} | ${row.company} | portal=${row.portal}`,
      );
    }
    if (list.length > 12) console.log(`  ... +${list.length - 12} more`);
  }

  // Roles that exist but have zero users
  const allRoles = await p.role.findMany({
    select: { name: true, company: { select: { name: true } }, _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  });
  console.log('\n=== Role instances with user counts ===');
  for (const r of allRoles) {
    if (['Company Owner', 'Employee', 'HR', 'Manager', 'Payroll'].includes(r.name)) {
      console.log(`  ${r.company.name} / ${r.name}: ${r._count.users} users`);
    }
  }

  await p.$disconnect();
})();
