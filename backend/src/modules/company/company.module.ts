import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../tenant/tenant.module';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
