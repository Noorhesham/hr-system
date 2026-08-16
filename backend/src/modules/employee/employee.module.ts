import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { HashingModule } from '../../core/hashing/hashing.module';
import { PlatformModule } from '../platform/platform.module';
import { CompanyModule } from '../company/company.module';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';

@Module({
  imports: [DatabaseModule, HashingModule, PlatformModule, CompanyModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
