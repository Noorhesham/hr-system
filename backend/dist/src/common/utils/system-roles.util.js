"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provisionSystemRoles = provisionSystemRoles;
const roles_constant_1 = require("../constants/roles.constant");
const permissions_constant_1 = require("../constants/permissions.constant");
async function provisionSystemRoles(db, companyId) {
    const allPerms = await db.permission.findMany({ select: { id: true, action: true } });
    const byAction = new Map(allPerms.map((p) => [p.action, p.id]));
    const owner = await db.role.upsert({
        where: { companyId_name: { companyId, name: roles_constant_1.COMPANY_OWNER_ROLE } },
        update: {},
        create: {
            companyId,
            name: roles_constant_1.COMPANY_OWNER_ROLE,
            permissions: { connect: allPerms.map((p) => ({ id: p.id })) },
        },
    });
    await db.role.update({
        where: { id: owner.id },
        data: { permissions: { set: allPerms.map((p) => ({ id: p.id })) } },
    });
    await db.role.upsert({
        where: { companyId_name: { companyId, name: roles_constant_1.EMPLOYEE_ROLE } },
        update: {},
        create: { companyId, name: roles_constant_1.EMPLOYEE_ROLE },
    });
    for (const [name, actions] of Object.entries(permissions_constant_1.SYSTEM_ROLE_PERMISSIONS)) {
        const ids = actions
            .map((a) => byAction.get(a))
            .filter((id) => Boolean(id));
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
    void roles_constant_1.HR_ROLE;
    void roles_constant_1.MANAGER_ROLE;
    void roles_constant_1.PAYROLL_ROLE;
    return { ownerRoleId: owner.id };
}
//# sourceMappingURL=system-roles.util.js.map