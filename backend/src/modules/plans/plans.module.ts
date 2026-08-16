import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../tenant/tenant.module';
import { PlatformModule } from '../platform/platform.module';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [DatabaseModule, TenantModule, PlatformModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
