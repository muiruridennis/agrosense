// inapp/inapp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InAppNotification } from './entities/inapp-notification.entity';

@Injectable()
export class InAppService {
  private readonly logger = new Logger(InAppService.name);

  constructor(
    @InjectRepository(InAppNotification)
    private readonly inAppRepo: Repository<InAppNotification>,
  ) {}

  async send(data: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    farmId?: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<{ messageId: string; status: string }> {
    try {
      const notification = this.inAppRepo.create({
        userId: data.userId,
        farmId: data.farmId,
        title: data.title,
        body: data.body,
        data: data.data,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        read: false,
        createdAt: new Date(),
      });

      const saved = await this.inAppRepo.save(notification);

      this.logger.log(`In-app notification sent to user ${data.userId}`);

      return {
        messageId: saved.id,
        status: 'delivered',
      };
    } catch (error) {
      this.logger.error(`In-app notification failed: ${error.message}`);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const query = this.inAppRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (options?.unreadOnly) {
      query.andWhere('notification.read = false');
    }

    if (options?.startDate) {
      query.andWhere('notification.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('notification.createdAt <= :endDate', { endDate: options.endDate });
    }

    const [items, total] = await query
      .orderBy('notification.createdAt', 'DESC')
      .skip(options?.offset || 0)
      .take(options?.limit || 20)
      .getManyAndCount();

    return { items, total };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.inAppRepo.update(
      { id: notificationId, userId },
      { read: true, readAt: new Date() },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.inAppRepo.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.inAppRepo.count({
      where: { userId, read: false },
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.inAppRepo.delete({ id: notificationId, userId });
  }

  async deleteAllRead(userId: string): Promise<void> {
    await this.inAppRepo.delete({ userId, read: true });
  }
}