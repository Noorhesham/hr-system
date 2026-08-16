"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const employees = await prisma.employee.findMany({
        select: { id: true, name: true, companyId: true },
        orderBy: { id: 'asc' },
    });
    const byCompany = new Map();
    for (const e of employees) {
        const list = byCompany.get(e.companyId) ?? [];
        list.push(e);
        byCompany.set(e.companyId, list);
    }
    let leads = 0;
    let mgrs = 0;
    for (const [, list] of byCompany) {
        const eligible = list.filter((e) => e.name !== 'مهاب محمد');
        const teamLeadCount = Math.max(1, Math.floor(eligible.length * 0.15));
        const deptMgrCount = Math.max(1, Math.floor(eligible.length * 0.1));
        const teamLeadIds = eligible.slice(0, teamLeadCount).map((e) => e.id);
        const deptMgrIds = eligible
            .slice(teamLeadCount, teamLeadCount + deptMgrCount)
            .map((e) => e.id);
        if (teamLeadIds.length) {
            const r = await prisma.employee.updateMany({
                where: { id: { in: teamLeadIds } },
                data: { jobRank: client_1.JobRank.TEAM_LEAD },
            });
            leads += r.count;
        }
        if (deptMgrIds.length) {
            const r = await prisma.employee.updateMany({
                where: { id: { in: deptMgrIds } },
                data: { jobRank: client_1.JobRank.DEPARTMENT_MANAGER },
            });
            mgrs += r.count;
        }
    }
    const counts = await prisma.employee.groupBy({
        by: ['jobRank'],
        _count: true,
    });
    console.log(JSON.stringify({ promotedLeads: leads, promotedManagers: mgrs, counts }, null, 2));
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=promote-managers.js.map