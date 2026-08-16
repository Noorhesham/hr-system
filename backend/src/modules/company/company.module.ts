import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../tenant/tenant.module';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { BenefitsSyncService } from './benefits-sync.service';

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [CompanyController],
  providers: [CompanyService, BenefitsSyncService],
  exports: [CompanyService, BenefitsSyncService],
})
export class CompanyModule {}
