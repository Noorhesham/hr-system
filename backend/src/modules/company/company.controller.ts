import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Tenant } from '../tenant/decorators/tenant.decorator';

/**
 * All routes require a valid JWT (JwtAuthGuard) + a resolved tenant
 * (TenantGuard). PermissionsGuard enforces @Permissions where present.
 * The companyId is taken from the token via @Tenant(), so the client can never
 * act on another company's data.
 */
@ApiTags('Company')
@ApiBearerAuth()
@Controller('company')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /** Any authenticated member of the tenant can read the company profile. */
  @Get()
  getCompany(@Tenant() companyId: string) {
    return this.companyService.getCompany(companyId);
  }

  /** Update company profile (name, logo, website, industry). */
  @Patch()
  @Permissions(PERMISSIONS.MANAGE_COMPANY_POLICY)
  @ApiBody({ type: UpdateCompanyDto })
  updateCompany(@Tenant() companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.updateCompany(companyId, dto);
  }

  /** Any authenticated member of the tenant can read the policy. */
  @Get('policy')
  getPolicy(@Tenant() companyId: string) {
    return this.companyService.getPolicy(companyId);
  }

  /** Only the tenant's Super Admin may change the policy. */
  @Patch('policy')
  @Permissions(PERMISSIONS.MANAGE_COMPANY_POLICY)
  @ApiBody({
    type: UpdatePolicyDto,
    examples: {
      default: {
        summary: 'Update company policy',
        value: {
          delayDeductionType: 'PER_MINUTE',
          defaultWeekendDays: ['FRIDAY', 'SATURDAY'],
          currency: 'SAR',
          payrollCycle: 'MONTHLY',
          payrollPayoutDay: 27,
          directBankTransfer: true,
          medicalInsuranceProvider: 'bupa',
          medicalInsuranceTier: 'B',
          gosiAutoEnroll: true,
          benefitHousingAllowance: false,
          benefitTransportAllowance: true,
          benefitAnnualTickets: true,
        },
      },
    },
  })
  updatePolicy(@Tenant() companyId: string, @Body() dto: UpdatePolicyDto) {
    return this.companyService.updatePolicy(companyId, dto);
  }
}
