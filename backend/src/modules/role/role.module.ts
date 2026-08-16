import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
