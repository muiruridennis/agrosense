import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobRunLog } from './entities/job-run-log.entity';

/**
 * Read-side query API over JobRunLog — "did job X run last night, and
 * did it succeed" as a method call instead of a hand-written query each
 * time. Write-side (creating/updating log rows during a run) stays in
 * SchedulerLockService, which owns the run itself; this only reads.
 */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(JobRunLog)
    private readonly jobRunLogRepository: Repository<JobRunLog>,
  ) {}

  onModuleInit(): void {
    this.logger.log('Scheduler module initialized');
  }

  async getRecentRuns(jobName?: string, limit = 20): Promise<JobRunLog[]> {
    return this.jobRunLogRepository.find({
      where: jobName ? { jobName } : {},
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  async getLastRun(jobName: string): Promise<JobRunLog | null> {
    return this.jobRunLogRepository.findOne({
      where: { jobName },
      order: { startedAt: 'DESC' },
    });
  }
}