import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

export enum JobRunStatus {
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  SKIPPED_LOCKED = 'skipped_locked', // another instance was already running it
}

/**
 * One row per scheduled-job execution. This is the entire reason the
 * scheduler module exists beyond raw @nestjs/schedule: without it, "did
 * last night's job run, and did it succeed" is a question you can only
 * answer by grepping instance logs. With it, it's a query.
 */
@Entity('job_run_logs')
export class JobRunLog extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  @Index()
  jobName: string;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'enum', enum: JobRunStatus, default: JobRunStatus.RUNNING })
  status: JobRunStatus;

  /** Free-form count meaningful to the specific job (rows updated, notifications sent, etc.) */
  @Column({ type: 'int', nullable: true })
  itemsProcessed: number | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;
}