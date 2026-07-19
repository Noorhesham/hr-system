import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
