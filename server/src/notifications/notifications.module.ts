import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationsController } from './notifications.controller';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { InAppModule } from '../inapp/inapp.module';
import { PushModule } from '../push/push.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    // TypeORM - register entities ]

    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      NotificationTemplate,
      NotificationDelivery,
    ]),

    // Channel modules - with forwardRef to avoid circular dependencies
    forwardRef(() => EmailModule),
    forwardRef(() => SmsModule),
    forwardRef(() => InAppModule),
    forwardRef(() => PushModule),
    forwardRef(() => JobsModule),
  ],

  controllers: [
    NotificationsController, // /notifications endpoints
    NotificationPreferencesController, // /notifications/preferences endpoints
  ],

  providers: [
    NotificationService, // Main notification service
    NotificationPreferencesService, // Preferences service
  ],

  exports: [NotificationService, NotificationPreferencesService],
})
export class NotificationModule {}
