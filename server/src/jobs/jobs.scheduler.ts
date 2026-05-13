import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  ADVISORY_QUEUE,
  DAILY_ADVISORY_JOB,
  // MARK_OVERDUE_VACCINATIONS_JOB,
  WEATHER_ADVISORIES_JOB,
} from './processors/daily-advisory.processor';

@Injectable()
export class JobsScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsScheduler.name);

  constructor(
    @InjectQueue(ADVISORY_QUEUE)
    private readonly advisoryQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    await this.scheduleRecurringJobs();
  }

  private async scheduleRecurringJobs() {
    // Remove stale repeatable jobs before re-registering
    const repeatable = await this.advisoryQueue.getRepeatableJobs();
    for (const job of repeatable) {
      await this.advisoryQueue.removeRepeatableByKey(job.key);
    }

    // Daily disease + alert advisory — 6:00 AM UTC (adjust per region if needed)
    await this.advisoryQueue.add(
      DAILY_ADVISORY_JOB,
      {},
      { repeat: { cron: '0 6 * * *' }, removeOnComplete: 20, removeOnFail: 10 },
    );

    // Mark overdue vaccinations — midnight UTC
    // await this.advisoryQueue.add(
    //   MARK_OVERDUE_VACCINATIONS_JOB,
    //   {},
    //   { repeat: { cron: '0 0 * * *' }, removeOnComplete: 5 },
    // );

    // Weather advisories — 7:00 AM UTC
    await this.advisoryQueue.add(
      WEATHER_ADVISORIES_JOB,
      {},
      { repeat: { cron: '0 7 * * *' }, removeOnComplete: 10 },
    );

    this.logger.log('Recurring jobs scheduled');
  }

  /** Manually trigger advisory for a single farm (useful for testing) */
  async triggerFarmAdvisory(farmId: string) {
    return this.advisoryQueue.add(
      DAILY_ADVISORY_JOB,
      { farmId },
      { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
    );
  }
}