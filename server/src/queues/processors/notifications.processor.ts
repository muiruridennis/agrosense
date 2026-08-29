import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';
import {
  NotificationDelivery,
  DeliveryStatus,
  NotificationChannel,
} from '../../notifications/entities/notification-delivery.entity';
import { NotificationStatus, NotificationPriority } from '../enums';
import {
  NOTIFICATION_QUEUE,
  NOTIFICATION_JOBS,
} from '../jobs.constants';
import { EmailService } from '../../email/email.service';
import { SmsService } from '../../sms/sms.service';
import { InAppService } from '../../inapp/inapp.service';
import { NotificationPreference } from '../../notifications/entities/notification-preference.entity';
import { PushService } from '../../push/push.service';

@Processor(NOTIFICATION_QUEUE)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepo: Repository<NotificationDelivery>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => SmsService))
    private readonly smsService: SmsService,
    @Inject(forwardRef(() => InAppService))
    private readonly inAppService: InAppService,
    @Inject(forwardRef(() => PushService))
    private readonly pushService: PushService,
  ) {
    this.logger.log('NOTIFICATION PROCESSOR INSTANTIATED! 🚀🚀🚀');

  }
  /**
   * MAIN DELIVERY JOB
   * Process a notification delivery for a specific channel
   *
   * This is where PREFERENCES are enforced
   */
  @Process(NOTIFICATION_JOBS.DELIVER)
  async handleDelivery(
    job: Job<{
      deliveryId: string;
      channel: NotificationChannel;
    }>,
  ) {
  console.log('🔥 RECEIVED JOB:', job.id, job.data);
    const { deliveryId, channel } = job.data;
    this.logger.debug(
      `[Job #${job.id}] Processing ${channel} delivery: ${deliveryId}`,
    );

    // 1. Get delivery + notification
    const delivery = await this.deliveryRepo.findOne({
      where: { id: deliveryId },
      relations: ['notification', 'notification.user'],
    });

    if (!delivery) {
      this.logger.error(`Delivery ${deliveryId} not found`);
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    // 2. Skip if already delivered or cancelled
    if (
      delivery.status === DeliveryStatus.DELIVERED ||
      delivery.status === DeliveryStatus.CANCELLED
    ) {
      this.logger.debug(
        `Delivery ${deliveryId} already ${delivery.status}, skipping`,
      );
      return;
    }

    const notification = delivery.notification;

    // 3. ⭐ CHECK PREFERENCES (CRITICAL)
    const canDeliver = await this.shouldDeliver(notification, channel);

    if (!canDeliver.allowed) {
      this.logger.log(`Skipping delivery: ${canDeliver.reason}`);
      delivery.status = DeliveryStatus.CANCELLED;
      delivery.error = canDeliver.reason ?? null;
      await this.deliveryRepo.save(delivery);
      return;
    }

    // 4. Update status to SENDING
    delivery.status = DeliveryStatus.SENDING;
    delivery.queuedAt = new Date();
    await this.deliveryRepo.save(delivery);

    try {
      // 5. Perform actual delivery based on channel
      let result;

      switch (channel) {
        case NotificationChannel.EMAIL:
          result = await this.deliverViaEmail(notification, delivery);
          break;

        case NotificationChannel.SMS:
          result = await this.deliverViaSms(notification, delivery);
          break;

        case NotificationChannel.IN_APP:
          result = await this.deliverViaInApp(notification, delivery);
          break;

        case NotificationChannel.PUSH:
          result = await this.deliverViaPush(notification, delivery);
          break;

        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }

      // 6. Mark as DELIVERED
      delivery.status = DeliveryStatus.DELIVERED;
      delivery.providerMessageId = result?.messageId;
      delivery.deliveredAt = new Date();
      delivery.sentAt = new Date();
      delivery.error = null;

      await this.deliveryRepo.save(delivery);

      this.logger.log(`✅ ${channel.toUpperCase()} delivered [${deliveryId}]`);

      // 7. Update notification status
      await this.updateNotificationStatus(notification.id);

      return { success: true, messageId: result?.messageId };
    } catch (error: unknown) {
      // Handle failure
      const err = error instanceof Error ? error : new Error(String(error));
      await this.handleDeliveryFailure(delivery, notification, channel, err);
      throw err;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERENCE CHECKING (NEW - CRITICAL)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if notification should be delivered
   * Respects:
   * - Channel enabled/disabled
   * - Quiet hours
   * - Category settings
   * - Critical override
   */
  private async shouldDeliver(
    notification: Notification,
    channel: NotificationChannel,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // No userId = no preferences to check, proceed
    if (!notification.userId) {
      return { allowed: true };
    }

    // Get user preferences
    const prefs = await this.preferenceRepo.findOne({
      where: { userId: notification.userId },
    });

    // No preferences = use defaults (allow all)
    if (!prefs) {
      return { allowed: true };
    }

    // 1. Check if channel is enabled
    const channelKey = this.getChannelKey(channel);
    if (!prefs.channels[channelKey]) {
      return {
        allowed: false,
        reason: `${channel} disabled in user preferences`,
      };
    }

    // 2. Check category settings
    if (notification.category && prefs.categories[notification.category]) {
      const categorySetting = prefs.categories[notification.category];
      if (!categorySetting.enabled) {
        return {
          allowed: false,
          reason: `Category "${notification.category}" disabled`,
        };
      }
    }

    // 3. Check quiet hours (unless critical)
    if (prefs.quietHours?.enabled) {
      const isQuiet = this.isInQuietHours(prefs.quietHours);
      const isCritical =
        notification.priority === NotificationPriority.CRITICAL;

      if (isQuiet && !isCritical) {
        if (!prefs.quietHours.overrideForCritical) {
          return {
            allowed: false,
            reason: `In quiet hours (${prefs.quietHours.start}-${prefs.quietHours.end})`,
          };
        }
      }
    }

    // 4. All checks passed
    return { allowed: true };
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(quietHours: any): boolean {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][
      now.getDay()
    ];

    // Check if today is in quiet hours days
    if (quietHours.days && !quietHours.days.includes(dayName)) {
      return false;
    }

    // Check if current time is between start and end
    const start = quietHours.start; // "22:00"
    const end = quietHours.end; // "08:00"

    if (start <= end) {
      // Normal case: 10:00 - 14:00
      return currentTime >= start && currentTime <= end;
    } else {
      // Wraps around midnight: 22:00 - 08:00
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * Map notification channel to preference key
   */
  private getChannelKey(channel: NotificationChannel): string {
    const channelMap = {
      [NotificationChannel.EMAIL]: 'email',
      [NotificationChannel.SMS]: 'sms',
      [NotificationChannel.PUSH]: 'push',
      [NotificationChannel.IN_APP]: 'inApp',
      [NotificationChannel.WHATSAPP]: 'whatsapp',
    };
    return channelMap[channel] || channel;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async deliverViaEmail(
    notification: Notification,
    delivery: NotificationDelivery,
  ): Promise<any> {
    // Get email from multiple sources
    const email =
      notification.data?.email ||
      delivery.recipient ||
      (notification.userId ? `user-${notification.userId}@farm.local` : null);

    if (!email) {
      throw new Error(
        'No email address found in notification or delivery data',
      );
    }

    this.logger.debug(`Sending email to ${email}`);

    return this.emailService.send({
      to: email,
      subject: notification.title,
      html: notification.body,
    });
  }

  private async deliverViaSms(
    notification: Notification,
    delivery: NotificationDelivery,
  ): Promise<any> {
    // Get phone from multiple sources
    const phone = notification.data?.phone || delivery.recipient;

    if (!phone) {
      throw new Error('No phone number found in notification or delivery data');
    }

    this.logger.debug(`Sending SMS to ${phone}`);

    // Truncate to 160 chars for SMS
    const message =
      notification.body.length > 160
        ? notification.body.substring(0, 157) + '...'
        : notification.body;

    return this.smsService.send({
      to: phone,
      message,
    });
  }

  private async deliverViaInApp(
    notification: Notification,
    delivery: NotificationDelivery,
  ): Promise<any> {
    if (!notification.userId) {
      throw new Error('No userId found for in-app notification');
    }

    this.logger.debug(`Saving in-app message for user ${notification.userId}`);

    // In-app notifications are already in DB, just mark as delivered
    return {
      messageId: notification.id,
      status: 'delivered',
    };
  }

  private async deliverViaPush(
    notification: Notification,
    delivery: NotificationDelivery,
  ): Promise<any> {
    if (!notification.userId) {
      throw new Error('No userId found for push notification');
    }

    this.logger.debug(`Sending push to user ${notification.userId}`);

    return this.pushService.send({
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      data: notification.data ?? undefined,
      priority:
        notification.priority === NotificationPriority.CRITICAL
          ? 'high'
          : 'normal',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAILURE HANDLING
  // ═══════════════════════════════════════════════════════════════════

  private async handleDeliveryFailure(
    delivery: NotificationDelivery,
    notification: Notification,
    channel: NotificationChannel,
    error: Error,
  ): Promise<void> {
    delivery.retryCount++;
    delivery.error = error.message;
    delivery.failedAt = new Date();

    const maxRetries = 3;

    if (delivery.retryCount >= maxRetries) {
      delivery.status = DeliveryStatus.FAILED;
      this.logger.error(
        `❌ ${channel} failed (${delivery.retryCount}/${maxRetries}): ${error.message}`,
      );
    } else {
      delivery.status = DeliveryStatus.PENDING;
      this.logger.warn(
        `⚠️ ${channel} failed (attempt ${delivery.retryCount}/${maxRetries}): ${error.message}`,
      );
    }

    await this.deliveryRepo.save(delivery);
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATUS UPDATE
  // ═══════════════════════════════════════════════════════════════════

  private async updateNotificationStatus(
    notificationId: string,
  ): Promise<void> {
    const deliveries = await this.deliveryRepo.find({
      where: { notificationId },
    });

    if (deliveries.length === 0) return;

    const allDelivered = deliveries.every(
      (d) =>
        d.status === DeliveryStatus.DELIVERED ||
        d.status === DeliveryStatus.CANCELLED,
    );
    const anyFailed = deliveries.some(
      (d) => d.status === DeliveryStatus.FAILED,
    );
    const anyPending = deliveries.some(
      (d) => d.status === DeliveryStatus.PENDING,
    );

    let newStatus = NotificationStatus.QUEUED;

    if (!anyPending) {
      if (anyFailed) {
        newStatus = NotificationStatus.FAILED;
      } else if (allDelivered) {
        newStatus = NotificationStatus.DELIVERED;
      }
    }

    await this.notificationRepo.update(notificationId, {
      status: newStatus,
      ...(newStatus === NotificationStatus.DELIVERED && {
        deliveredAt: new Date(),
      }),
    });

    this.logger.debug(`Notification ${notificationId} status → ${newStatus}`);
  }
}
