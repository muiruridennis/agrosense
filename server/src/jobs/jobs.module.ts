
import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Farm } from '../farms/entities/farm.entity';
import { PricingHistory } from '../pricing/entities/pricing-history.entity';
import { PricingTier } from '../pricing/entities/pricing-tier.entity';
import { RecordPricingSnapshot } from '../pricing/entities/record-pricing-snapshot.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationDelivery } from '../notifications/entities/notification-delivery.entity';
import { NotificationPreference } from '../notifications/entities/notification-preference.entity';

// Processors
import { DailyAdvisoryProcessor } from './processors/daily-advisory.processor';
import { PricingActivationProcessor } from './processors/pricing-activation.processor';
import { NotificationsProcessor } from './processors/notifications.processor';

// Scheduler
import { JobsScheduler } from './jobs.scheduler';

// Constants
import {
  ADVISORY_QUEUE,
  PRICING_QUEUE,
  NOTIFICATION_QUEUE,
} from './jobs.constants';

// Modules
import { DiseaseEngineModule } from '../disease-engine/disease-engine.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { NotificationModule } from '../notifications/notifications.module';
import { CropsModule } from '../crops/crops.module';
import { DairyModule } from '../dairy/dairy.module';
import { SmallRuminantsModule } from '../smallruminants/smallruminants.module';
import { PoultryModule } from '../poultry/poultry.module';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { InAppModule } from '../inapp/inapp.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    // ✅ Register ALL Bull queues in one place
    BullModule.registerQueue(
      { name: ADVISORY_QUEUE },
      { name: PRICING_QUEUE },
      { name: NOTIFICATION_QUEUE },
    ),

    // ✅ Register all entities used by processors
    TypeOrmModule.forFeature([
      Farm,
      PricingTier,
      PricingHistory,
      RecordPricingSnapshot,
      Notification,
      NotificationDelivery,
      NotificationPreference,
    ]),

    // ✅ Import channel modules for notification delivery
    forwardRef(() => EmailModule),
    forwardRef(() => SmsModule),
    forwardRef(() => InAppModule),
    forwardRef(() => PushModule),

    // ✅ Import other required modules
    forwardRef(() => DiseaseEngineModule),
    RecommendationsModule,
    forwardRef(() => NotificationModule),  // For preferences service
    CropsModule,
    DairyModule,
    SmallRuminantsModule,
    PoultryModule,
  ],

  providers: [
    // ✅ All processors
    NotificationsProcessor,  // ← NEW: Now here!
    DailyAdvisoryProcessor,
    PricingActivationProcessor,

    // Scheduler
    JobsScheduler,
  ],

  exports: [JobsScheduler, BullModule],
})
export class JobsModule {}