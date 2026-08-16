"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const p = new client_1.PrismaClient();
async function main() {
    const companyId = 'seed-najaz-demo';
    const today = new Date();
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
    const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 2));
    const emps = await p.employee.findMany({
        where: { companyId, isActive: true },
        take: 5,
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
    });
    for (const e of emps) {
        await p.leaveRequest.create({
            data: {
                employeeId: e.id,
                fromDate: from,
                toDate: to,
                status: client_1.LeaveStatus.APPROVED,
                reason: 'إجازة معتمدة (demo)',
            },
        });
        console.log('ON_LEAVE →', e.name);
    }
}
main()
    .catch(console.error)
    .finally(() => p.$disconnect());
//# sourceMappingURL=patch-on-leave.js.map