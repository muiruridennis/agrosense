import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Flock } from './flock.entity';
import { User } from '../../users/entities/user.entity';

export enum RecordStatus {
  DRAFT = 'draft', // worker saved but not submitted
  SUBMITTED = 'submitted', // worker submitted, awaiting manager review
  REVIEWED = 'reviewed', // manager reviewed and approved
  FLAGGED = 'flagged', // manager flagged — needs worker correction
}

/**
 * FlockRecord — one daily entry per flock.
 * Workers submit; managers review.
 * Stores raw data + computed KPIs + financial metrics.
 * Fields are nullable where they only apply to one flock type.
 */
@Entity('flock_records')
export class FlockRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  flockId!: string;

  @ManyToOne(() => Flock, (flock) => flock.records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flockId' })
  flock!: Flock;

  /** The day this record covers — one record per flock per day */
  @Column({ type: 'date' })
  recordDate!: Date;

  @Column({ type: 'enum', enum: RecordStatus, default: RecordStatus.DRAFT })
  status!: RecordStatus;

  // ── Submission & review trail ─────────────────────────────────────────────

  @Column({ type: 'uuid' })
  submittedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submittedById' })
  submittedBy!: User;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy!: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  /** Manager's note — required when status is FLAGGED */
  @Column({ type: 'text', nullable: true })
  reviewNote!: string | null;

  // ── Common fields (both layers & broilers) ────────────────────────────────

  /** Birds that died naturally */
  @Column({ type: 'int', default: 0 })
  mortality!: number;

  /** Birds removed due to illness/injury (not dead but taken out) */
  @Column({ type: 'int', default: 0 })
  culls!: number;

  /** Feed consumed in kg */
  @Column({ type: 'float', default: 0 })
  feedConsumedKg!: number;

  /** Feed type/brand used e.g "Unga Chick Mash", "Starter", "Finisher" */
  @Column({ type: 'varchar', length: 100, nullable: true })
  feedType!: string | null;

  /** Water consumed in litres */
  @Column({ type: 'float', nullable: true })
  waterConsumedLitres!: number | null;

  /** Number of visibly sick birds observed */
  @Column({ type: 'int', default: 0 })
  sickBirds!: number;

  /** Medication or treatment given */
  @Column({ type: 'text', nullable: true })
  medication!: string | null;

  /** Temperature recorded (°C) — relevant for closed houses */
  @Column({ type: 'float', nullable: true })
  temperatureCelsius!: number | null;

  /** Free-text remarks from the worker */
  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  // ── Layers-specific fields ────────────────────────────────────────────────

  /** Eggs collected in the morning */
  @Column({ type: 'int', nullable: true })
  morningEggs!: number | null;

  /** Eggs collected in the evening */
  @Column({ type: 'int', nullable: true })
  eveningEggs!: number | null;

  /** Cracked or broken eggs (not sellable) */
  @Column({ type: 'int', nullable: true })
  brokenEggs!: number | null;

  /** Dirty or soiled eggs (may be sold at discount) */
  @Column({ type: 'int', nullable: true })
  dirtyEggs!: number | null;

  // ── Broiler-specific fields ───────────────────────────────────────────────

  /** Average body weight from sample weighing (kg) */
  @Column({ type: 'float', nullable: true })
  avgBodyWeightKg!: number | null;

  /** Number of birds weighed for the sample */
  @Column({ type: 'int', nullable: true })
  sampleSize!: number | null;

  /** Uniformity % — how evenly the flock is growing */
  @Column({ type: 'float', nullable: true })
  uniformityPercent!: number | null;

  // ═════════════════════════════════════════════════════════════════════════════
  // COMPUTED KPIs & FINANCIAL METRICS (Stored for fast querying & reporting)
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * BIOLOGICAL KPIs
   */

  /**
   * Layers: (totalEggs / currentLiveBirds) * 100
   * Percentage of birds laying (if 85% production, 85 eggs per 100 birds)
   */
  @Column({ type: 'float', nullable: true })
  productionRatePercent!: number | null;

  /**
   * Broilers: feedConsumedKg / weightGainKg
   * Lower is better — industry target ~1.8 for Ross 308
   * FCR = Feed Conversion Ratio
   */
  @Column({ type: 'float', nullable: true })
  feedConversionRatio!: number | null;

  /**
   * Live bird count after applying today's mortality + culls.
   * Snapshot stored so manager sees exactly what was alive that day.
   */
  @Column({ type: 'int', nullable: true })
  liveBirdsAfterRecord!: number | null;

  /**
   * FINANCIAL KPIs
   */

  /**
   * Today's feed cost = feedConsumedKg * 35 KES/kg
   * Stored so dashboards can sum/average without recalculation
   */
  @Column({ type: 'float', default: 0 })
  feedCost!: number;

  /**
   * Revenue from eggs today (layers only)
   * = (morningEggs + eveningEggs - broken - dirty) * 4 KES/egg
   */
  @Column({ type: 'float', default: 0 })
  eggRevenue!: number;

  /**
   * Cost of today's mortality + culls = (mortality + culls) * 800 KES/bird
   * Helps quantify biological loss as financial impact
   */
  @Column({ type: 'float', default: 0 })
  mortalityCost!: number;

  /**
   * HEALTH & RISK SCORING
   */

  /**
   * Health Risk Score (0-100)
   * Calculated from: sick birds %, mortality %, temperature deviation
   * 0 = excellent health, 100 = critical outbreak risk
   *
   * Usage:
   * < 30: Healthy flock, low risk
   * 30-60: Monitor closely, possible early signs
   * 60-75: High risk, investigate immediately
   * 75+: Critical, isolation & treatment needed
   */
  @Column({ type: 'float', default: 0 })
  healthRiskScore!: number;

  /**
   * Flags for deviations from expected performance
   * Comma-separated list: "high_mortality", "low_production", "poor_fcr", etc.
   */
  @Column({ type: 'text', nullable: true })
  deviationFlags!: string | null;
}
