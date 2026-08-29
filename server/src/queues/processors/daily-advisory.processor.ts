import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Job } from 'bull';
import { Farm } from '../../farms/entities/farm.entity';
import { NotificationService } from '../../notifications/notifications.service';
import { NotificationChannel } from '../../notifications/enums';
import {
  ADVISORY_QUEUE,
  DAILY_ADVISORY_JOB,
  WEATHER_ADVISORIES_JOB,
} from '../jobs.constants';

@Processor(ADVISORY_QUEUE)
export class DailyAdvisoryProcessor {
  private readonly logger = new Logger(DailyAdvisoryProcessor.name);

  constructor(
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    private readonly notificationsService: NotificationService,
  ) {}

  /**
   * Main daily job — runs for every active farm.
   * Evaluates disease rules, creates alerts, generates recommendations,
   * and sends SMS to farmers with active alerts.
   */
  @Process(DAILY_ADVISORY_JOB)
  async runDailyAdvisory(job: Job<{ farmId?: string }>) {
    const { farmId } = job.data;

    const farms = farmId
      ? await this.farmRepo
          .findOne({
            where: { id: farmId },
            relations: ['owner'],
          })
          .then((f) => (f ? [f] : []))
      : await this.farmRepo.find({ relations: ['owner'] });

    this.logger.log(`Running daily advisory for ${farms.length} farm(s)`);

    let processed = 0;
    let alertsCreated = 0;
  }
}
