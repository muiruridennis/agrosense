import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { SchedulerLockService } from '../scheduler-lock.service';
import { JobRunLog } from '../entities/job-run-log.entity';
import { SCHEDULER_CRON } from '../constants/scheduler.constants';

@Injectable()
export class SystemScheduler {
  private readonly logger = new Logger(SystemScheduler.name);

  /** How long JobRunLog rows are kept before being pruned. */
  private readonly JOB_RUN_LOG_RETENTION_DAYS = 30;

  constructor(
    @InjectRepository(JobRunLog)
    private readonly jobRunLogRepository: Repository<JobRunLog>,

    private readonly schedulerLock: SchedulerLockService,
  ) {}

  /**
   * Daily system maintenance. Currently owns one concrete job: pruning
   * JobRunLog so it doesn't grow unbounded — that table is written to by
   * every scheduled job in this module, so its retention is genuinely
   * this module's own concern, not any domain module's.
   *
   * Other "system-level maintenance" (expired temp records, etc.) isn't
   * implemented here — I don't have a concrete need to point at yet, and
   * inventing one would just be a TODO with extra steps. Add jobs here as
   * real cleanup needs surface elsewhere in the codebase.
   */
  @Cron(SCHEDULER_CRON.DAILY_MIDNIGHT, {
    name: 'system-daily-maintenance',
    timeZone: 'Africa/Nairobi',
  })
  async performDailyMaintenance(): Promise<void> {
    await this.schedulerLock.runExclusive(
      'system-daily-maintenance',
      async () => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.JOB_RUN_LOG_RETENTION_DAYS);

        const result = await this.jobRunLogRepository.delete({
          startedAt: LessThan(cutoff),
        });

        const pruned = result.affected ?? 0;

        this.logger.log(
          `Pruned ${pruned} job run log entries older than ` +
          `${this.JOB_RUN_LOG_RETENTION_DAYS} days.`,
        );

        return { itemsProcessed: pruned };
      },
    );
  }
}