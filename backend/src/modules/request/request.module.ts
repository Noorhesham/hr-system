import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationModule } from '../notification/notification.module';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';

@Module({
  imports: [DatabaseModule, NotificationModule],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}
