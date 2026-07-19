import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';

/**
 * All routes require a valid JWT (JwtAuthGuard) + a resolved tenant
 * (TenantGuard). RolesGuard additionally enforces @Roles where present.
 * The companyId is taken from the token via @Tenant(), so the client can never
 * act on another company's data.
 */
@ApiTags('Company')
@ApiBearerAuth()
@Controller('company')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /** Any authenticated member of the tenant can read the policy. */
  @Get('policy')
  getPolicy(@Tenant() companyId: string) {
    return this.companyService.getPolicy(companyId);
  }

  /** Only the tenant's Super Admin may change the policy. */
  @Patch('policy')
  @Roles(COMPANY_OWNER_ROLE)
  @ApiBody({
    type: UpdatePolicyDto,
    examples: {
      default: {
        summary: 'Update company policy',
        value: {
          delayDeductionType: 'PER_MINUTE',
          absenceMultiplierUnexcused: 1.0,
          absenceMultiplierExcused: 0.5,
          overtimeMultiplierNormal: 1.5,
          overtimeMultiplierHoliday: 2.0,
          gosiEmployeePercentage: 9.75,
          gosiCompanyPercentage: 11.75,
          gosiNumber: 'GOSI-99887',
          defaultWeekendDays: ['FRIDAY', 'SATURDAY'],
        },
      },
    },
  })
  updatePolicy(@Tenant() companyId: string, @Body() dto: UpdatePolicyDto) {
    return this.companyService.updatePolicy(companyId, dto);
  }
}
