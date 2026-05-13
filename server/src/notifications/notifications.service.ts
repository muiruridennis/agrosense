import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from './entities/notification.entity';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { User } from '../users/entities/user.entity';

export interface SendNotificationOptions {
  user: Pick<User, 'id' | 'phoneNumber'> & { fcmToken?: string };
  title: string;
  body: string;
  channels?: NotificationChannel[];
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
  ) {}

  /**
   * Central dispatch — saves notification log + sends via requested channels.
   */
  async send(opts: SendNotificationOptions): Promise<void> {
    const channels = opts.channels ?? [NotificationChannel.IN_APP];

    for (const channel of channels) {
      const notification = this.repo.create({
        userId: opts.user.id,
        channel,
        title: opts.title,
        body: opts.body,
        data: opts.data ?? null,
      });

      await this.repo.save(notification);

      try {
        if (channel === NotificationChannel.SMS) {
          const result = await this.smsService.send(
            opts.user.phoneNumber,
            `${opts.title}: ${opts.body}`,
          );
          await this.repo.update(notification.id, {
            status: result.status === 'sent'
              ? NotificationStatus.SENT
              : NotificationStatus.FAILED,
            providerMessageId: result.messageId || null,
            failureReason: result.failureReason ?? null,
            sentAt: result.status === 'sent' ? new Date() : null,
          });
        }

        if (channel === NotificationChannel.PUSH && opts.user.fcmToken) {
          const result = await this.pushService.sendToToken(
            opts.user.fcmToken,
            { title: opts.title, body: opts.body, data: opts.data },
          );
          await this.repo.update(notification.id, {
            status: result.status === 'sent'
              ? NotificationStatus.SENT
              : NotificationStatus.FAILED,
            providerMessageId: result.messageId || null,
            failureReason: result.failureReason ?? null,
            sentAt: result.status === 'sent' ? new Date() : null,
          });
        }

        if (channel === NotificationChannel.IN_APP) {
          await this.repo.update(notification.id, {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          });
        }
      } catch (err: any) {
        this.logger.error(`Failed to send ${channel} notification`, err?.message);
        await this.repo.update(notification.id, {
          status: NotificationStatus.FAILED,
          failureReason: err?.message,
        });
      }
    }
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId, channel: NotificationChannel.IN_APP },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.update(
      { id, userId },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
      },
    });
  }

  // ─── Event Listeners ──────────────────────────────────────────────────────

  @OnEvent('vaccination.scheduled')
  async handleVaccinationScheduled(payload: {
    farmId: string;
    animalId: string;
    vaccineName: string;
    nextDueAt: Date;
    user: Pick<User, 'id' | 'phoneNumber'>;
  }) {
    const dueDate = new Date(payload.nextDueAt).toLocaleDateString('en-KE');
    await this.send({
      user: payload.user,
      title: 'Vaccination reminder',
      body: `${payload.vaccineName} vaccination is due on ${dueDate}.`,
      channels: [NotificationChannel.IN_APP],
      data: { farmId: payload.farmId, animalId: payload.animalId },
    });
  }
}