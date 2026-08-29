import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import {
  ADVISORY_QUEUE,
  DAILY_ADVISORY_JOB,
  WEATHER_ADVISORIES_JOB,
  PRICING_QUEUE,
  ACTIVATE_SCHEDULED_PRICING_JOB,
  NOTIFICATION_QUEUE,
} from './jobs.constants';

@Injectable()
export class JobsScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsScheduler.name);

  constructor(
    @InjectQueue(ADVISORY_QUEUE)
    private readonly advisoryQueue: Queue,
    @InjectQueue(PRICING_QUEUE)
    private readonly pricingQueue: Queue,
    @InjectQueue(NOTIFICATION_QUEUE) // ← NEW
    private readonly notificationQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    await this.scheduleRecurringJobs();
  }

  private async scheduleRecurringJobs() {
    this.logger.log('🔄 Initializing job scheduler...');

    // Remove stale repeatable jobs from all queues
    await this.clearStaleJobs();

    // Daily disease + alert advisory — 6:00 AM UTC
    await this.advisoryQueue.add(
      DAILY_ADVISORY_JOB,
      {},
      {
        repeat: { cron: '0 6 * * *' },
        removeOnComplete: 20,
        removeOnFail: 10,
      },
    );
    this.logger.log('✅ Daily advisory scheduled (6:00 AM UTC)');

    // Weather advisories — 7:00 AM UTC
    await this.advisoryQueue.add(
      WEATHER_ADVISORIES_JOB,
      {},
      {
        repeat: { cron: '0 7 * * *' },
        removeOnComplete: 10,
      },
    );
    this.logger.log('✅ Weather advisory scheduled (7:00 AM UTC)');

    // Pricing activation — every 5 minutes
    await this.pricingQueue.add(
      ACTIVATE_SCHEDULED_PRICING_JOB,
      {},
      {
        repeat: { cron: '*/5 * * * *' },
        removeOnComplete: 20,
        removeOnFail: 10,
      },
    );
    this.logger.log('✅ Pricing activation scheduled (every 5 minutes)');

    this.logger.log('✅ All recurring jobs scheduled!');
  }

  private async clearStaleJobs() {
    this.logger.log('🗑️ Cleaning up stale repeatable jobs...');

    // Clear advisory queue
    const advisoryRepeatable = await this.advisoryQueue.getRepeatableJobs();
    for (const job of advisoryRepeatable) {
      await this.advisoryQueue.removeRepeatableByKey(job.key);
    }

    // Clear pricing queue
    const pricingRepeatable = await this.pricingQueue.getRepeatableJobs();
    for (const job of pricingRepeatable) {
      await this.pricingQueue.removeRepeatableByKey(job.key);
    }

    // Clear notification queue (new)
    const notificationRepeatable =
      await this.notificationQueue.getRepeatableJobs();
    for (const job of notificationRepeatable) {
      await this.notificationQueue.removeRepeatableByKey(job.key);
    }

    this.logger.log('✅ Stale jobs cleaned up');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Manual Trigger Methods
  // ═══════════════════════════════════════════════════════════════════════════

  async triggerFarmAdvisory(farmId: string) {
    this.logger.log(`Triggering advisory for farm ${farmId}`);
    return this.advisoryQueue.add(
      DAILY_ADVISORY_JOB,
      { farmId },
      { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
    );
  }

  async triggerPricingActivation(farmId?: string) {
    this.logger.log(
      `Triggering pricing activation ${farmId ? `for farm ${farmId}` : 'for all farms'}`,
    );
    return this.pricingQueue.add(
      ACTIVATE_SCHEDULED_PRICING_JOB,
      farmId ? { farmId } : {},
      { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
    );
  }

  // ✅ NEW: Trigger notification delivery
  async triggerNotificationDelivery(deliveryId: string, channel: string) {
    this.logger.log(
      `Triggering notification delivery: ${deliveryId} via ${channel}`,
    );
    return this.notificationQueue.add(
      'deliver', // Job name
      { deliveryId, channel },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }
}
