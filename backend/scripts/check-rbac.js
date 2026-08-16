const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  console.log('permissions', await p.permission.count());
  console.log(await p.role.groupBy({ by: ['name'], _count: true }));
  await p.$disconnect();
})();
