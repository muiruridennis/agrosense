import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { SCHEDULER_CRON } from '../constants/scheduler.constants';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  /**
   * Periodically checks for scheduled notifications
   * that need to be dispatched.
   */
  @Cron(SCHEDULER_CRON.EVERY_5_MINUTES, {
    name: 'notification-schedule-processing',
    timeZone: 'Africa/Nairobi',
  })
  async processScheduledNotifications(): Promise<void> {
    this.logger.log('Processing scheduled notifications');

    // TODO:
    // Find notifications that are due
    // Push them into the notification queue
  }
}