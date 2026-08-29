import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';

import { JobRunLog, JobRunStatus } from './entities/job-run-log.entity';

export interface JobResult {
  /** Optional count to record on the log row — rows updated, messages sent, etc. */
  itemsProcessed?: number;
}

@Injectable()
export class SchedulerLockService {
  private readonly logger = new Logger(SchedulerLockService.name);

  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(JobRunLog)
    private readonly jobRunLogRepository: Repository<JobRunLog>,
  ) {}

  /**
   * Runs `fn` under a Postgres advisory lock keyed by `jobName`.
   *
   * pg_try_advisory_lock is non-blocking: if another instance already
   * holds the lock for this job name, this call returns immediately
   * without running `fn` at all — which is exactly what "3 instances,
   * same @Cron schedule, only one should actually execute" needs. No
   * queue, no extra infra — this piggybacks on the Postgres connection
   * you already have.
   *
   * The lock is released automatically when the session (this specific
   * pooled connection) ends, so we run everything on one dedicated
   * QueryRunner and release explicitly in the `finally` — never rely on
   * the pool to clean this up for you.
   */
  async runExclusive(
    jobName: string,
    fn: () => Promise<JobResult | void>,
  ): Promise<void> {
    const lockKey = this.toLockKey(jobName);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let acquired = false;

    try {
      const result = await queryRunner.query(
        'SELECT pg_try_advisory_lock($1) AS acquired',
        [lockKey],
      );
      acquired = result?.[0]?.acquired === true;

      if (!acquired) {
        this.logger.log(
          `Skipping "${jobName}" — another instance already holds the lock.`,
        );
        await this.jobRunLogRepository.save(
          this.jobRunLogRepository.create({
            jobName,
            startedAt: new Date(),
            finishedAt: new Date(),
            status: JobRunStatus.SKIPPED_LOCKED,
          }),
        );
        return;
      }

      const runLog = await this.jobRunLogRepository.save(
        this.jobRunLogRepository.create({
          jobName,
          startedAt: new Date(),
          status: JobRunStatus.RUNNING,
        }),
      );

      try {
        const result = (await fn()) ?? {};

        runLog.finishedAt = new Date();
        runLog.status = JobRunStatus.SUCCEEDED;
        runLog.itemsProcessed = result.itemsProcessed ?? null;
        await this.jobRunLogRepository.save(runLog);
      } catch (error) {
        runLog.finishedAt = new Date();
        runLog.status = JobRunStatus.FAILED;
        runLog.error = error instanceof Error ? error.message : String(error);
        await this.jobRunLogRepository.save(runLog);

        this.logger.error(`Job "${jobName}" failed: ${runLog.error}`);
        // Deliberately not rethrown — a failed scheduled job should be
        // visible in JobRunLog, not crash the process or take down
        // whatever else @nestjs/schedule has queued next.
      }
    } finally {
      if (acquired) {
        await queryRunner.query('SELECT pg_advisory_unlock($1)', [lockKey]);
      }
      await queryRunner.release();
    }
  }

  /**
   * pg_try_advisory_lock takes a bigint. Job names are strings for
   * readability in code and in JobRunLog — hash to a stable 32-bit int
   * so any job name works without maintaining a manual key registry.
   */
  private toLockKey(jobName: string): number {
    const hash = crypto.createHash('sha256').update(jobName).digest();
    return hash.readInt32BE(0);
  }
}