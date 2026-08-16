const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'modules');

const targets = [
  ['loan/loan.controller.ts', 'MANAGE_LOANS'],
  ['document/document.controller.ts', 'MANAGE_DOCUMENTS'],
  ['shift/shift.controller.ts', 'MANAGE_SHIFTS'],
  ['department/department.controller.ts', 'MANAGE_DEPARTMENTS'],
  ['salary-component/salary-component.controller.ts', 'UPDATE_EMPLOYEE'],
  ['attendance/attendance.controller.ts', 'MANAGE_ATTENDANCE'],
  ['plans/plans.controller.ts', 'MANAGE_COMPANY_POLICY'],
];

for (const [rel, perm] of targets) {
  const file = path.join(root, rel);
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('@Roles(COMPANY_OWNER_ROLE)')) {
    console.log('skip (already wired?)', rel);
    continue;
  }
  if (!s.includes('PermissionsGuard')) {
    s = s.replace(
      "import { RolesGuard } from '../../common/guards/roles.guard';\n",
      "import { RolesGuard } from '../../common/guards/roles.guard';\n" +
        "import { PermissionsGuard } from '../../common/guards/permissions.guard';\n" +
        "import { Permissions } from '../../common/decorators/permissions.decorator';\n" +
        "import { PERMISSIONS } from '../../common/constants/permissions.constant';\n",
    );
    s = s.replace(
      '@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)',
      '@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)',
    );
  }
  s = s.replace(
    /@Roles\(COMPANY_OWNER_ROLE\)/g,
    `@Permissions(PERMISSIONS.${perm})`,
  );
  if (!s.includes('@Roles(')) {
    s = s.replace(
      /import \{ Roles \} from '..\/..\/common\/decorators\/roles.decorator';\r?\n/g,
      '',
    );
    s = s.replace(
      /import \{ COMPANY_OWNER_ROLE \} from '..\/..\/common\/constants\/roles.constant';\r?\n/g,
      '',
    );
  }
  fs.writeFileSync(file, s);
  console.log('wired', rel, perm);
}
