import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Cow } from './cow.entity';
import { LactationRecord } from './lactation-record.entity';

export enum LactationCycleStatus {
  ACTIVE = 'active',       // currently lactating
  COMPLETED = 'completed', // lactation ended normally (dry-off)
  TERMINATED = 'terminated', // ended early (disease, mastitis, etc)
}

/**
 * LactationCycle — represents a single lactation period.
 *
 * A lactation begins when a cow freshens (gives birth) and ends when she is dried off.
 * Between these dates, daily milk yield records are collected.
 *
 * Example timeline:
 *   freshenDate:        2025-11-15 (cow gave birth)
 *   daysInMilk counter: 0, 1, 2, ... 305 days
 *   dryOffDate:         2026-08-17 (milking stopped)
 *   status:             completed
 *
 * Next lactation starts when she gives birth again (next freshenDate).
 */
@Entity('lactation_cycles')
@Index('idx_lactation_cycles_cow', ['cowId'])
@Index('idx_lactation_cycles_status', ['status'])
export class LactationCycle extends BaseEntity {
  @Column({ type: 'uuid' })
  cowId!: string;

  @ManyToOne(() => Cow, (cow) => cow.lactationCycles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cowId' })
  cow!: Cow;

  /**
   * Date the cow gave birth (freshened).
   * Start of this lactation cycle.
   * Day 0 of lactation.
   */
  @Column({ type: 'date' })
  freshenDate!: Date;

  /**
   * Parity — which lactation is this?
   * 1 = first lactation (first calf), 2 = second calf, etc.
   * Copied from cow.lactationNumber for denormalization (fast lookup).
   */
  @Column({ type: 'int' })
  lactationNumber!: number;

  /**
   * Date milking stopped (dried off the cow).
   * Null if lactation is still active.
   *
   * Typical gestation is 280 days, plus 3–4 weeks dry period before next birth.
   * So dryOffDate is typically ~305–310 days after freshenDate.
   */
  @Column({ type: 'date', nullable: true })
  dryOffDate!: Date | null;

  /**
   * Expected total duration of lactation (days).
   * Standard: 305 days. Can vary by breed and management.
   *
   * Used to forecast when the cow should be dried off.
   */
  @Column({ type: 'int', default: 305 })
  expectedDurationDays!: number;

  /**
   * Status: active (still milking), completed (dried off), or terminated (ended early).
   * Default: active.
   */
  @Column({
    type: 'enum',
    enum: LactationCycleStatus,
    default: LactationCycleStatus.ACTIVE,
  })
  status!: LactationCycleStatus;

  /**
   * Daily milk yield records for this lactation.
   * One entry per day (one per cow per day) while cow is in milk.
   */
  @OneToMany(() => LactationRecord, (record) => record.lactationCycle, {
    cascade: true,
  })
  dailyRecords!: LactationRecord[];

  /**
   * Reason if terminated early (disease, mastitis, cull decision, etc).
   */
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ── Timestamps ─────────────────────────────────────────────────────────
  // Inherited from BaseEntity:
  // - id (uuid)
  // - createdAt (timestamptz)
  // - updatedAt (timestamptz)
}