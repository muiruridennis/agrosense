import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PoultryHouse } from './poultry-house.entity';
import { FlockRecord } from './flock-record.entity';
import { BaseEntity } from '../../common/entities/base.entity';

export enum FlockType {
  LAYERS = 'layers', // egg production
  BROILERS = 'broilers', // meat production
  UNKNOWN = 'unknown',
  KIENYEJI = 'kienyeji',
}

export enum FlockStatus {
  ACTIVE = 'active', // currently running
  CLOSED = 'closed', // sold/depleted — house ready for next batch
  SUSPENDED = 'suspended', // paused (disease outbreak etc.)
}

/**
 * FLOCK STAGE — Full lifecycle progression
 * Automatically assigned based on age and type
 */
export enum FlockStage {
  PLACED = 'placed', // Just arrived, not yet in brooding house
  BROODING = 'brooding', // First 2-3 weeks — critical heat/care period
  GROWING = 'growing', // Mid-period growth (weeks 2-6 broilers, 2-12 layers)
  LAYING_PEAK = 'laying_peak', // Layers at peak production (weeks 24-50)
  LAYING_DECLINE = 'laying_decline', // Layers declining production (weeks 50+)
  HARVEST_READY = 'harvest_ready', // Broilers ready for slaughter (week 6+)
  DEPLETED = 'depleted', // Production too low to continue economically
  CLOSED = 'closed', // Flock officially ended
}

/**
 * Flock — a batch of birds placed in a house on a specific date.
 * When birds are sold/depleted, status → CLOSED and a new flock starts.
 * This gives full history per house + comprehensive business metrics.
 */
@Entity('flocks')
export class Flock extends BaseEntity {
  @Column({ type: 'uuid' })
  houseId!: string;
  
  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @ManyToOne(() => PoultryHouse, (house) => house.flocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'houseId' })
  house!: PoultryHouse;

  @Column({ type: 'enum', enum: FlockType })
  type!: FlockType;

  @Column({
    type: 'enum',
    enum: FlockStatus,
    default: FlockStatus.ACTIVE,
  })
  status!: FlockStatus;

  /**
   * LIFECYCLE STAGE — Auto-assigned based on age + flock type
   * Automatically transitions as flock ages
   */
  @Column({
    type: 'enum',
    enum: FlockStage,
    default: FlockStage.PLACED,
  })
  currentStage!: FlockStage;

  /** Bird breed e.g "Kenbro", "Ross 308", "Sasso", "ISA Brown" */
  @Column({ type: 'varchar', length: 100 })
  breed!: string;

  /** Number of birds placed on placement date */
  @Column({ type: 'int' })
  initialCount!: number;

  /** Live birds today — decremented by mortality + culls in each record */
  @Column({ type: 'int' })
  currentCount!: number;

  /** Date chicks/pullets arrived */
  @Column({ type: 'date' })
  placementDate!: Date;

  /** Age at placement in weeks (0 = day-old chicks) */
  @Column({ type: 'int', default: 0 })
  ageAtPlacementWeeks!: number;

  // ── Broiler-specific targets ──────────────────────────────────────────────

  /** Target live weight at slaughter (kg) — broilers only */
  @Column({ type: 'float', nullable: true })
  targetWeightKg!: number | null;

  /** Target days to market — broilers only */
  @Column({ type: 'int', nullable: true })
  targetDays!: number | null;

  // ── Layers-specific ───────────────────────────────────────────────────────

  /** Age when production started (weeks) — layers only */
  @Column({ type: 'int', nullable: true })
  productionStartWeek!: number | null;

  // ── PERFORMANCE BENCHMARKS (Initialized at flock creation) ────────────────

  /** Expected mortality % based on breed */
  @Column({ type: 'float', nullable: true })
  expectedMortalityPercent!: number | null;

  /** Expected daily feed per bird (grams) */
  @Column({ type: 'float', nullable: true })
  expectedDailyFeedPerBirdGrams!: number | null;

  /** Profitability target (KES) */
  @Column({ type: 'float', nullable: true })
  breakEvenTarget!: number | null;

  // ── CUMULATIVE FINANCIAL METRICS ──────────────────────────────────────────

  /** Total feed cost incurred (KES) */
  @Column({ type: 'float', default: 0 })
  feedCostTotal!: number;

  /** Total revenue from eggs or meat sales (KES) */
  @Column({ type: 'float', default: 0 })
  revenueTotal!: number;

  /** Net profit = revenueTotal - feedCostTotal (KES) */
  @Column({ type: 'float', default: 0 })
  netProfit!: number;

  /** ROI % = (netProfit / feedCostTotal) * 100 */
  @Column({ type: 'float', default: 0 })
  roiPercent!: number;

  // ── CLOSURE METRICS ───────────────────────────────────────────────────────

  /** When flock was officially closed */
  @Column({ type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  /** Reason for closure (harvest, disease, economic) */
  @Column({ type: 'varchar', length: 200, nullable: true })
  depletionReason!: string | null;

  /** Final mortality % at closure */
  @Column({ type: 'float', nullable: true })
  finalMortalityPercent!: number | null;

  /** Final FCR at closure (broilers) */
  @Column({ type: 'float', nullable: true })
  feedConversionRatio!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
  @Column({ type: 'jsonb', nullable: true })
  sales!: {
    buyer: string;
    quantity: number;
    pricePerBird: number;
    totalAmount: number;
    saleDate: Date;
    receiptNumber?: string;
    paymentStatus: 'pending' | 'paid' | 'partial';
    notes?: string;
  }[];

  @OneToMany(() => FlockRecord, (record) => record.flock, { cascade: true })
  records!: FlockRecord[];
}
