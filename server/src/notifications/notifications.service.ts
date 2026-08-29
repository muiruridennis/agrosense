import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository, Not } from 'typeorm';
import type { Queue } from 'bull';

import { Notification } from './entities/notification.entity';
import {
  NotificationDelivery,
  DeliveryStatus,
  NotificationChannel,
} from './entities/notification-delivery.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

import { NotificationPriority, NotificationStatus } from './enums';

import { SendNotificationDto } from './dtos/send-notification.dto';

import { NotificationPreferencesService } from './notification-preferences.service';
import {
  NOTIFICATION_QUEUE,
  NOTIFICATION_JOBS,
} from '../queues/jobs.constants';

/**
 * NotificationService
 *
 * Responsible for:
 * - Creating notifications
 * - Managing delivery records
 * - Enqueueing background jobs
 * - Tracking delivery status
 *
 * Does NOT:
 * - Send to external providers (processor does that)
 * - Check preferences (done upfront)
 * - Handle retries (Bull does that)
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepo: Repository<NotificationDelivery>,
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Send a notification
   *
   * ✅ Validates input
   * ✅ Checks user preferences
   * ✅ Creates notification + deliveries
   * ✅ Enqueues background jobs
   * ✅ Returns immediately
   *
   * Returns in <100ms, actual delivery happens in background
   */
  async send(
    userId: string,
    dto: SendNotificationDto,
  ): Promise<{
    notificationId: string;
    status: NotificationStatus;
    jobsQueued: number;
    channels: NotificationChannel[];
  }> {
    // 1. Validate all inputs
    this.validateSendInput(userId, dto);

    // 2. Get user preferences
    const preferences =
      await this.preferencesService.getUserPreferences(userId);

    // 3. Filter enabled channels
    const enabledChannels = this.filterEnabledChannels(
      dto.channels,
      preferences,
    );

    if (enabledChannels.length === 0) {
      this.logger.warn(`No enabled channels for user ${userId}`);
      throw new BadRequestException('No enabled channels for this user');
    }

    // 4. Create notification record
    const notification = await this.createNotification(
      userId,
      dto,
      enabledChannels,
    );

    // 5. Create delivery records (one per channel)
    const deliveries = await this.createDeliveryRecords(
      notification.id,
      enabledChannels,
      dto.data,
    );

    // 6. Enqueue background jobs
    const jobsQueued = await this.enqueueDeliveryJobs(
      deliveries,
      dto.priority,
      dto.scheduledFor,
    );

    this.logger.log(
      `✓ Notification ${notification.id} queued with ${jobsQueued} delivery jobs`,
    );

    return {
      notificationId: notification.id,
      status: NotificationStatus.QUEUED,
      jobsQueued,
      channels: enabledChannels,
    };
  }

  /**
   * Has a notification already been sent for this category+reference+user?
   *
   * Deliberately NOT built into send() itself — send() is also called
   * directly by the /notifications/send endpoint and other one-off
   * callers that should NOT be silently deduped. This is an opt-in guard
   * for callers (recurring sweeps, event-triggered notifications) that
   * specifically want "at most once per category+reference+recipient"
   * semantics — e.g. a daily cron shouldn't re-notify a farmer about the
   * same overdue schedule every single day.
   *
   * This is check-then-act, which would normally be a TOCTOU risk on
   * its own — safe here only because every caller so far (scheduled
   * sweeps) already runs inside a single-instance lock (see
   * SchedulerLockService.runExclusive). A caller without that guarantee
   * would need its own concurrency protection before relying on this.
   */
  async hasBeenNotified(
    category: string,
    referenceId: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.notificationRepo.count({
      where: {
        category,
        referenceId,
        userId,
        status: Not(NotificationStatus.CANCELLED),
      },
    });

    return count > 0;
  }

  /**
   * Get notification with delivery records
   */
  async getNotification(
    notificationId: string,
  ): Promise<Notification & { deliveries: NotificationDelivery[] }> {
    if (!notificationId) {
      throw new BadRequestException('Notification ID is required');
    }

    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    const deliveries = await this.deliveryRepo.find({
      where: { notificationId },
    });

    return { ...notification, deliveries };
  }

  /**
   * Get delivery status for a notification
   */
  async getDeliveryStatus(notificationId: string): Promise<{
    notificationId: string;
    overallStatus: NotificationStatus;
    createdAt: Date;
    deliveredAt?: Date;
    deliveries: Array<{
      channel: NotificationChannel;
      status: DeliveryStatus;
      sentAt?: Date;
      deliveredAt?: Date;
      error?: string;
      retryCount: number;
    }>;
  }> {
    const notification = await this.getNotification(notificationId);

    return {
      notificationId,
      overallStatus: notification.status,
      createdAt: notification.createdAt,
      deliveredAt: notification.deliveredAt ?? undefined,
      deliveries: notification.deliveries.map((d) => ({
        channel: d.channel,
        status: d.status,
        sentAt: d.sentAt ?? undefined,
        deliveredAt: d.deliveredAt ?? undefined,
        error: d.error ?? undefined,
        retryCount: d.retryCount,
      })),
    };
  }

  /**
   * Cancel a notification (cancel all pending deliveries)
   */
  async cancel(notificationId: string): Promise<void> {
    await this.getNotification(notificationId); // Verify exists

    // Update notification status
    await this.notificationRepo.update(notificationId, {
      status: NotificationStatus.CANCELLED,
      updatedAt: new Date(),
    });

    // Cancel pending deliveries
    await this.deliveryRepo.update(
      { notificationId, status: DeliveryStatus.PENDING },
      { status: DeliveryStatus.CANCELLED, updatedAt: new Date() },
    );

    this.logger.log(`✓ Cancelled notification ${notificationId}`);
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<{
    total: number;
    queued: number;
    sending: number;
    delivered: number;
    failed: number;
    cancelled: number;
    successRate: number;
  }> {
    const [total, queued, sending, delivered, failed, cancelled] =
      await Promise.all([
        this.notificationRepo.count(),
        this.notificationRepo.count({
          where: { status: NotificationStatus.QUEUED },
        }),
        this.notificationRepo.count({
          where: { status: NotificationStatus.SENDING },
        }),
        this.notificationRepo.count({
          where: { status: NotificationStatus.DELIVERED },
        }),
        this.notificationRepo.count({
          where: { status: NotificationStatus.FAILED },
        }),
        this.notificationRepo.count({
          where: { status: NotificationStatus.CANCELLED },
        }),
      ]);

    const successRate =
      total > 0 ? Math.round((delivered / total) * 10000) / 100 : 0;

    return {
      total,
      queued,
      sending,
      delivered,
      failed,
      cancelled,
      successRate,
    };
  }
  async getDeliveryStats() {
    const [pending, sending, delivered, failed, cancelled] = await Promise.all([
      this.deliveryRepo.count({
        where: { status: DeliveryStatus.PENDING },
      }),
      this.deliveryRepo.count({
        where: { status: DeliveryStatus.SENDING },
      }),
      this.deliveryRepo.count({
        where: { status: DeliveryStatus.DELIVERED },
      }),
      this.deliveryRepo.count({
        where: { status: DeliveryStatus.FAILED },
      }),
      this.deliveryRepo.count({
        where: { status: DeliveryStatus.CANCELLED },
      }),
    ]);

    const total = pending + sending + delivered + failed + cancelled;

    return {
      total,
      pending,
      sending,
      delivered,
      failed,
      cancelled,
      successRate:
        total === 0 ? 0 : Math.round((delivered / total) * 10000) / 100,
    };
  }

  /**
   * Get notification history for a user
   */
  async getUserNotifications(userId: any, limit = 20) {
    console.log('Fetching notifications for user:', userId);
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const notifications = await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    if (!notifications || notifications.length === 0) {
      throw new NotFoundException(`No notifications found for user ${userId}`);
    }

    return notifications;
  }

  /**
   * Get notifications for a farm
   */
  async getFarmNotifications(
    farmId: string,
    limit = 20,
  ): Promise<Notification[]> {
    if (!farmId) {
      throw new BadRequestException('Farm ID is required');
    }

    return this.notificationRepo.find({
      where: { farmId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS - INPUT VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validate all send input parameters
   * Throws BadRequestException with clear message if invalid
   */
  private validateSendInput(userId: string, dto: SendNotificationDto): void {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException('Valid user ID is required');
    }

    if (!this.isValidUUID(userId)) {
      throw new BadRequestException('User ID must be a valid UUID');
    }

    // Validate title
    if (!dto.title || dto.title.trim().length < 3) {
      throw new BadRequestException('Title must be at least 3 characters');
    }

    if (dto.title.length > 255) {
      throw new BadRequestException('Title must not exceed 255 characters');
    }

    // Validate body
    if (!dto.body || dto.body.trim().length < 5) {
      throw new BadRequestException('Body must be at least 5 characters');
    }

    if (dto.body.length > 2000) {
      throw new BadRequestException('Body must not exceed 2000 characters');
    }

    // Validate channels
    if (
      !dto.channels ||
      !Array.isArray(dto.channels) ||
      dto.channels.length === 0
    ) {
      throw new BadRequestException('At least one channel is required');
    }

    const validChannels = Object.values(NotificationChannel);
    for (const channel of dto.channels) {
      if (!validChannels.includes(channel)) {
        throw new BadRequestException(`Invalid channel: ${channel}`);
      }
    }

    // Validate priority if provided
    if (dto.priority) {
      const validPriorities = Object.values(NotificationPriority);
      if (!validPriorities.includes(dto.priority)) {
        throw new BadRequestException(`Invalid priority: ${dto.priority}`);
      }
    }

    // Validate scheduledFor if provided
    if (dto.scheduledFor) {
      const scheduledDate = new Date(dto.scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        throw new BadRequestException('Invalid scheduled date format');
      }
      if (scheduledDate < new Date()) {
        throw new BadRequestException('Scheduled date must be in the future');
      }
    }

    // Validate farmId if provided
    if (dto.farmId && !this.isValidUUID(dto.farmId)) {
      throw new BadRequestException('Farm ID must be a valid UUID');
    }

    // Validate templateId if provided
    if (dto.templateId && !this.isValidUUID(dto.templateId)) {
      throw new BadRequestException('Template ID must be a valid UUID');
    }
  }

  /**
   * Check if string is valid UUID v4
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS - CHANNEL & PREFERENCE FILTERING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Filter channels based on user preferences
   * Removes disabled channels
   */
  private filterEnabledChannels(
    requestedChannels: NotificationChannel[],
    preferences: NotificationPreference | null,
  ): NotificationChannel[] {
    if (!preferences) {
      return requestedChannels;
    }

    return requestedChannels.filter((channel) => {
      const key = this.getChannelPreferenceKey(channel);
      return preferences.channels[key] !== false;
    });
  }

  /**
   * Map notification channel to preference key
   */
  private getChannelPreferenceKey(
    channel: NotificationChannel,
  ): keyof NotificationPreference['channels'] {
    const map: Record<
      NotificationChannel,
      keyof NotificationPreference['channels']
    > = {
      [NotificationChannel.EMAIL]: 'email',
      [NotificationChannel.SMS]: 'sms',
      [NotificationChannel.PUSH]: 'push',
      [NotificationChannel.IN_APP]: 'inApp',
      [NotificationChannel.WHATSAPP]: 'whatsapp',
    };
    return map[channel];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS - ENTITY CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create and save notification entity
   */
  private async createNotification(
    userId: string,
    dto: SendNotificationDto,
    channels: NotificationChannel[],
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      farmId: dto.farmId ?? null,
      title: dto.title,
      body: dto.body,
      channels,
      category: dto.category ?? null,
      priority: dto.priority ?? NotificationPriority.MEDIUM,
      status: NotificationStatus.QUEUED,
      data: dto.data ?? null,
      referenceId: dto.reference?.id ?? null,
      scheduledFor: dto.scheduledFor ?? null,
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.debug(`✓ Created notification ${saved.id}`);
    return saved;
  }

  /**
   * Create delivery records (one per channel)
   */
  private async createDeliveryRecords(
    notificationId: string,
    channels: NotificationChannel[],
    data?: Record<string, any>,
  ): Promise<NotificationDelivery[]> {
    const deliveries = channels.map((channel) =>
      this.deliveryRepo.create({
        notificationId,
        channel,
        status: DeliveryStatus.PENDING,
        recipient: this.getRecipientForChannel(data, channel),
        retryCount: 0,
        nextRetryAt: null,
        error: null,
        metadata: null,
      }),
    );

    const saved = await this.deliveryRepo.save(deliveries);
    this.logger.debug(`✓ Created ${saved.length} delivery records`);
    return saved;
  }

  /**
   * Get recipient contact for a channel
   */
  private getRecipientForChannel(
    data: Record<string, any> | undefined,
    channel: NotificationChannel,
  ): string | null {
    if (!data) return null;

    switch (channel) {
      case NotificationChannel.EMAIL:
        return data.email ?? null;
      case NotificationChannel.SMS:
        return data.phone ?? null;
      case NotificationChannel.PUSH:
      case NotificationChannel.IN_APP:
        return data.userId ?? null;
      case NotificationChannel.WHATSAPP:
        return data.whatsapp ?? null;
      default:
        return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS - QUEUE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enqueue delivery jobs for all deliveries
   * Returns number of successfully queued jobs
   */
  private async enqueueDeliveryJobs(
    deliveries: NotificationDelivery[],
    priority?: NotificationPriority,
    scheduledFor?: Date,
  ): Promise<number> {
    let jobsQueued = 0;

    for (const delivery of deliveries) {
      try {
        // Calculate total delay (schedule + priority)
        const scheduleDelay = this.getScheduleDelay(scheduledFor);
        const priorityDelay = this.getPriorityDelay(priority);
        const totalDelay = scheduleDelay + priorityDelay;

        // Add job to queue
        await this.notificationQueue.add(
          NOTIFICATION_JOBS.DELIVER,
          {
            deliveryId: delivery.id,
            channel: delivery.channel,
          },
          {
            delay: totalDelay,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        jobsQueued++;
        this.logger.debug(`✓ Queued ${delivery.channel} delivery job`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to queue ${delivery.channel} delivery: ${errorMessage}`,
        );
      }
    }

    return jobsQueued;
  }

  /**
   * Get delay for scheduled delivery
   */
  private getScheduleDelay(scheduledFor?: Date): number {
    if (!scheduledFor) return 0;
    const delay = scheduledFor.getTime() - Date.now();
    return Math.max(0, delay);
  }

  /**
   * Get delay based on priority
   * - CRITICAL: 0ms (send immediately)
   * - HIGH: 1000ms (send ASAP)
   * - MEDIUM: 5000ms (send soon) - default
   * - LOW: 30000ms (can wait)
   */
  private getPriorityDelay(priority?: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 0;
      case NotificationPriority.HIGH:
        return 1000;
      case NotificationPriority.LOW:
        return 30000;
      case NotificationPriority.MEDIUM:
      default:
        return 5000;
    }
  }
  //  async markAsRead(notificationId: string, userId: string): Promise<void> {
  //   await this.notificationRepo.update(
  //     { id: notificationId, userId },
  //     { read: true, readAt: new Date() },
  //   );
  // }

  // async markAllAsRead(userId: string): Promise<void> {
  //   await this.notificationRepo.update(
  //     { userId, read: false },
  //     { read: true, readAt: new Date() },
  //   );
  // }

  // async getUnreadCount(userId: string): Promise<number> {
  //   return this.notificationRepo.count({
  //     where: { userId, read: false },
  //   });
  // }

  // async deleteNotification(notificationId: string, userId: string): Promise<void> {
  //   await this.notificationRepo.delete({ id: notificationId, userId });
  // }

  // async deleteAllRead(userId: string): Promise<void> {
  //   await this.notificationRepo.delete({ userId, read: true });
  // }
}
