import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import {
  CurrentUser,
  Tenant,
} from '../tenant/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
@Controller()
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  /** List purchasable subscription plans (ordered by price). */
  @Get('plans')
  listPlans() {
    return this.plans.listPlans();
  }

  /**
   * Continue with free trial (no card). Keeps TRIAL status and advances
   * onboarding past PRICING into attendance setup.
   */
  @Post('company/start-trial')
  @Permissions(PERMISSIONS.MANAGE_COMPANY_POLICY)
  startTrial(
    @Tenant() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.plans.startTrial(companyId, user.userId);
  }

  /**
   * Dummy checkout. Declines cards ending in 0000; otherwise activates the
   * company subscription and advances onboarding past PRICING.
   */
  @Post('company/subscribe')
  @Permissions(PERMISSIONS.MANAGE_COMPANY_POLICY)
  @ApiBody({
    type: SubscribeDto,
    examples: {
      success: {
        summary: 'Successful dummy payment',
        value: {
          planId: '<uuid>',
          billingCycle: 'MONTHLY',
          cardHolderName: 'Mohab Mohamed',
          cardNumber: '4242 4242 4242 4242',
          cvv: '123',
          expiry: '12/28',
          billingAddress: 'الشارع، رقم المبنى، الحي',
          city: 'الرياض',
          postalCode: '12345',
          country: 'SA',
          promoCode: 'WELCOME20',
          savePaymentMethod: true,
        },
      },
      decline: {
        summary: 'Dummy decline (card ends in 0000)',
        value: {
          planId: '<uuid>',
          billingCycle: 'MONTHLY',
          cardHolderName: 'Test User',
          cardNumber: '4111111111110000',
          cvv: '123',
          expiry: '12/28',
          billingAddress: 'Street',
          city: 'Riyadh',
          postalCode: '12345',
          country: 'SA',
        },
      },
    },
  })
  subscribe(
    @Tenant() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubscribeDto,
  ) {
    return this.plans.subscribe(companyId, user.userId, dto);
  }
}
