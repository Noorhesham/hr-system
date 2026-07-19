import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EssService } from './ess.service';
import { EssController } from './ess.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [EssController],
  providers: [EssService],
})
export class EssModule {}
