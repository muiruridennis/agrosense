import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Flock } from './flock.entity';
import { User } from '../../users/entities/user.entity';

export enum RecordStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  FLAGGED = 'flagged',
}

@Entity('flock_records')
export class FlockRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  flockId!: string;

  @ManyToOne(() => Flock, (flock) => flock.records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flockId' })
  flock!: Flock;

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

  @Column({ type: 'text', nullable: true })
  reviewNote!: string | null;

  // ── Common fields ──────────────────────────────────────────────────────────

  @Column({ type: 'int', default: 0 })
  mortality!: number;

  /** Deliberate management removal — distinct from natural mortality */
  @Column({ type: 'int', default: 0 })
  culls!: number;

  @Column({ type: 'float', default: 0 })
  feedConsumedKg!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  feedType!: string | null;

  @Column({ type: 'float', nullable: true })
  waterConsumedLitres!: number | null;

  @Column({ type: 'int', default: 0 })
  sickBirds!: number;

  @Column({ type: 'text', nullable: true })
  medication!: string | null;

  @Column({ type: 'float', nullable: true })
  temperatureCelsius!: number | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  // ── Layers-specific: egg counts (individual eggs, not trays) ───────────────
  // Stored at egg-level precision because mortality/production-rate math
  // needs it. Tray figures are DERIVED via the entity getters below —
  // never store trays as a separate persisted column, or the two values
  // can drift out of sync.

  @Column({ type: 'int', nullable: true })
  morningEggs!: number | null;

  @Column({ type: 'int', nullable: true })
  eveningEggs!: number | null;

  @Column({ type: 'int', nullable: true })
  brokenEggs!: number | null;

  @Column({ type: 'int', nullable: true })
  dirtyEggs!: number | null;

  // ── Broilers-specific ────────────────────────────────────────────────────

  @Column({ type: 'float', nullable: true })
  avgBodyWeightKg!: number | null;

  @Column({ type: 'int', nullable: true })
  sampleSize!: number | null;

  /**
   * Uniformity sample data — NEW. Previously uniformityPercent was accepted
   * directly with no way to verify anyone actually calculated it (min/max
   * spread was never captured). Now the raw sample is stored and the
   * percentage is always derived in the service layer.
   */
  @Column({ type: 'jsonb', nullable: true })
  uniformitySample!: {
    minWeightKg: number;
    maxWeightKg: number;
    sampleSize: number;
    weights?: number[];
  } | null;

  /** Derived and stored at write-time for fast querying — see service */
  @Column({ type: 'float', nullable: true })
  uniformityPercent!: number | null;

  // ═════════════════════════════════════════════════════════════════════════
  // COMPUTED KPIs & FINANCIAL METRICS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Layers: (totalEggs / liveBirdsEligibleToLay) * 100
   * FIXED: now capped at 100% and excludes birds not yet at lay age.
   * Previously could exceed 100% with no upper bound (observed 201.6%
   * in production data — a structurally impossible value).
   */
  @Column({ type: 'float', nullable: true })
  productionRatePercent!: number | null;

  /**
   * Broilers only. FIXED: now calculated as cumulative feed ÷ cumulative
   * weight gain across the flock's life, not daily-snapshot multiplication.
   * See PoultryService.calculateFCR() for the corrected formula.
   */
  @Column({ type: 'float', nullable: true })
  feedConversionRatio!: number | null;

  @Column({ type: 'int', nullable: true })
  liveBirdsAfterRecord!: number | null;

  // ── Financial KPIs — now use per-flock economicAssumptions, not hardcoded ──

  @Column({ type: 'float', default: 0 })
  feedCost!: number;

  @Column({ type: 'float', default: 0 })
  eggRevenue!: number;

  @Column({ type: 'float', default: 0 })
  mortalityCost!: number;

  // ── Health & risk scoring ───────────────────────────────────────────────

  @Column({ type: 'float', default: 0 })
  healthRiskScore!: number;

  @Column({ type: 'text', nullable: true })
  deviationFlags!: string | null;

  // ═════════════════════════════════════════════════════════════════════════
  // VIRTUAL HELPERS — tray conversion, never persisted separately
  // ═════════════════════════════════════════════════════════════════════════

  /** Gross eggs collected today, before quality deductions */
  get totalEggsCollected(): number {
    return (this.morningEggs ?? 0) + (this.eveningEggs ?? 0);
  }

  /** Saleable eggs — gross minus broken/dirty. This is what generates revenue. */
  get saleableEggs(): number {
    return Math.max(
      0,
      this.totalEggsCollected - (this.brokenEggs ?? 0) - (this.dirtyEggs ?? 0),
    );
  }

  /** Saleable eggs expressed in trays (1 tray = 30 eggs), to 1 decimal */
  get saleableTrays(): number {
    return parseFloat((this.saleableEggs / 30).toFixed(1));
  }
}
