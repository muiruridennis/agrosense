import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { SCHEDULER_CRON } from '../constants/scheduler.constants'; 
import { SchedulerLockService } from '../scheduler-lock.service';
import { VaccinationService } from '../../vaccination/vaccination.service';

@Injectable()
export class VaccinationScheduler {
  private readonly logger = new Logger(VaccinationScheduler.name);

  constructor(
    private readonly vaccinationService: VaccinationService,
    private readonly schedulerLock: SchedulerLockService,
  ) {}

  /**
   * Runs every morning. Auto-transitions genuinely abandoned schedules to
   * MISSED (grace period lives in VaccinationService — see
   * MISSED_GRACE_PERIOD_DAYS), and fires the MISSED notification for
   * each one it transitions.
   */
  @Cron(SCHEDULER_CRON.DAILY_6_AM, {
    name: 'vaccination-daily-processing',
    timeZone: 'Africa/Nairobi',
  })
  async processDailyVaccinations(): Promise<void> {
    await this.schedulerLock.runExclusive(
      'vaccination-daily-processing',
      async () => {
        const result = await this.vaccinationService.processScheduledVaccinations();

        this.logger.log(
          `Checked ${result.checked} due/overdue schedules — ` +
          `${result.autoMissed} auto-marked missed, ${result.failed} failed.`,
        );

        return { itemsProcessed: result.checked };
      },
    );
  }

  /**
   * Runs every morning, shortly after the missed-transition sweep.
   * Sends the one-time DUE reminder for schedules that just became due —
   * deduped per schedule via NotificationService.hasBeenNotified, so this
   * firing daily doesn't mean the farmer gets notified daily.
   */
  @Cron(SCHEDULER_CRON.DAILY_7_AM, {
    name: 'vaccination-due-reminders',
    timeZone: 'Africa/Nairobi',
  })
  async notifyDueVaccinations(): Promise<void> {
    await this.schedulerLock.runExclusive(
      'vaccination-due-reminders',
      async () => {
        const result = await this.vaccinationService.notifyDueSchedules();

        this.logger.log(
          `Checked ${result.checked} due schedules — ` +
          `${result.notified} notified, ${result.failed} failed.`,
        );

        return { itemsProcessed: result.checked };
      },
    );
  }

  /**
   * Runs nightly. Defensive reconciliation sweep — re-derives coverage
   * for every non-terminal schedule from its actual records, catching
   * any future drift the same way the pre-fix bugs (stale vaccinatedBirds
   * cache, frozen target vs. live population) could have caused.
   */
  @Cron(SCHEDULER_CRON.DAILY_MIDNIGHT, {
    name: 'vaccination-coverage-reconciliation',
    timeZone: 'Africa/Nairobi',
  })
  async reconcileVaccinationCoverage(): Promise<void> {
    await this.schedulerLock.runExclusive(
      'vaccination-coverage-reconciliation',
      async () => {
        const result = await this.vaccinationService.reconcileScheduleCoverage();

        this.logger.log(
          `Reconciled ${result.checked} schedules — ` +
          `${result.corrected} corrected, ${result.failed} failed.`,
        );

        return { itemsProcessed: result.checked };
      },
    );
  }
}