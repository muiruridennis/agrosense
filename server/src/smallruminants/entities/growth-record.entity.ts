import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Ruminant } from './ruminant.entity';
import { User } from '../../users/entities/user.entity';

/**
 * GrowthRecord — one weighing entry for a ruminant.
 *
 * Unlike dairy cattle (daily milk records), ruminants have periodic weighing.
 * Typically: weekly or bi-weekly during fattening period.
 *
 * Purpose:
 *   - Track growth trajectory
 *   - Estimate days to market
 *   - Monitor health (unexpected weight loss = problem)
 *   - Calculate weight gain rate (kg/week)
 *
 * Example:
 *   Goat born day 0
 *   Week 2: 5 kg
 *   Week 4: 8 kg
 *   Week 6: 12 kg
 *   Week 8: 16 kg
 *   Target: 30 kg → estimated market at week 16
 */
@Entity('growth_records')
@Index('idx_growth_records_ruminant', ['ruminantId'])
@Index('idx_growth_records_date', ['recordDate'])
export class GrowthRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  ruminantId!: string;

  @ManyToOne(() => Ruminant, (ruminant) => ruminant.growthRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ruminantId' })
  ruminant!: Ruminant;

  /**
   * Date of weighing.
   */
  @Column({ type: 'date' })
  recordDate!: Date;

  /**
   * Weight in kg.
   */
  @Column({ type: 'float' })
  weightKg!: number;

  /**
   * Body condition score (BCS).
   * Scale: 1 (too thin) to 5 (too fat)
   * Optimal: 2.5–3.5
   * Visual inspection (no scale needed).
   */
  @Column({ type: 'int', nullable: true })
  bodyConditionScore!: number | null; // 1-5

  /**
   * Who recorded this weight?
   */
  @Column({ type: 'uuid' })
  recordedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recordedById' })
  recordedBy!: User;

  /**
   * When recorded.
   */
  @Column({ type: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Notes on condition, parasite load, illness signs, etc.
   */
  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  // ── Computed fields (for dashboard) ─────────────────────────────────────
  /**
   * Computed on save: weight gain since last record.
   * Used for trending.
   */
  @Column({ type: 'float', nullable: true })
  weightGainKg!: number | null;

  /**
   * Days since last record (if any).
   * Used to calculate kg/day growth rate.
   */
  @Column({ type: 'int', nullable: true })
  daysSinceLastRecord!: number | null;

  // ── Timestamps ─────────────────────────────────────────────────────────
  // Inherited from BaseEntity:
  // - id (uuid)
  // - createdAt (timestamptz)
  // - updatedAt (timestamptz)
}