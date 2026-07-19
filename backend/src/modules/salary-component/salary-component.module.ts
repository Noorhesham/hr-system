import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SalaryComponentService } from './salary-component.service';
import { SalaryComponentController } from './salary-component.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [SalaryComponentController],
  providers: [SalaryComponentService],
})
export class SalaryComponentModule {}
