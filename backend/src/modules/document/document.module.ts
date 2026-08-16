import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UploadModule } from '../upload/upload.module';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';

@Module({
  imports: [DatabaseModule, UploadModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
