import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsService } from './sms.service';
import { PushService } from './push.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), HttpModule],
  providers: [NotificationsService, SmsService, PushService],
  controllers: [NotificationsController],
  exports: [NotificationsService, SmsService, PushService],
})
export class NotificationsModule {}