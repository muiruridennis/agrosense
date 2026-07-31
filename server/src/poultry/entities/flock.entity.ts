import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PoultryHouse } from './poultry-house.entity';
import { FlockRecord } from './flock-record.entity';
import { BaseEntity } from '../../common/entities/base.entity';

export enum FlockType {
  LAYERS = 'layers',
  BROILERS = 'broilers',
  UNKNOWN = 'unknown',
  KIENYEJI = 'kienyeji',
}

export enum FlockStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

export enum FlockStage {
  PLACED = 'placed',
  BROODING = 'brooding',
  GROWING = 'growing',
  LAYING_PEAK = 'laying_peak',
  LAYING_DECLINE = 'laying_decline',
  HARVEST_READY = 'harvest_ready',
  DEPLETED = 'depleted',
  CLOSED = 'closed',
}

/**
 * Economic assumptions — set once at flock creation, used consistently
 * across every KPI/financial calculation for THIS flock's lifetime.
 *
 * Previously: 4 KES/egg, 35 KES/kg feed, 250 KES/kg meat, 800 KES/bird
 * mortality cost were hardcoded as magic numbers in two different service
 * methods (calculateRecordKPIs and generateClosureReport) with no shared
 * source of truth. A market price change required a code deploy.
 *
 * Now: stored per-flock so historical flocks retain the prices that were
 * actually true when they ran, while new flocks can use updated defaults.
 */
export interface EconomicAssumptions {
  feedCostPerKg: number;
  eggPriceKesPerTray: number;
  broilerPricePerKg: number;
  mortalityCostPerBird: number;
  dayOldChickWeightKg: number;
}

/** System-wide defaults — used only when a flock has no override set */


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

  @Column({
    type: 'enum',
    enum: FlockStage,
    default: FlockStage.PLACED,
  })
  currentStage!: FlockStage;

  @Column({ type: 'varchar', length: 100 })
  breed!: string;

  @Column({ type: 'int' })
  initialCount!: number;

  @Column({ type: 'int' })
  currentCount!: number;

  @Column({ type: 'date' })
  placementDate!: Date;

  @Column({ type: 'int', default: 0 })
  ageAtPlacementWeeks!: number;

  // ── Broiler-specific targets ──────────────────────────────────────────────

  @Column({ type: 'float', nullable: true })
  targetWeightKg!: number | null;

  @Column({ type: 'int', nullable: true })
  targetDays!: number | null;

  // ── Layers-specific ───────────────────────────────────────────────────────

  @Column({ type: 'int', nullable: true })
  productionStartWeek!: number | null;

  // ── PERFORMANCE BENCHMARKS (set at creation, compared against at closure) ──

  @Column({ type: 'float', nullable: true })
  expectedMortalityPercent!: number | null;

  @Column({ type: 'float', nullable: true })
  expectedDailyFeedPerBirdGrams!: number | null;

  @Column({ type: 'float', nullable: true })
  breakEvenTarget!: number | null;

  /**
   * Per-flock economic assumptions override. NULL means "use system
   * defaults at calculation time" — see PricingService.getAssumptions().
   * Stored as jsonb so historical flocks keep the exact prices that
   * were true when they were placed, even if defaults change later.
   */
  @Column({ type: 'jsonb', nullable: true })
  economicAssumptions!: EconomicAssumptions | null;

  // ── CUMULATIVE FINANCIAL METRICS ──────────────────────────────────────────

  @Column({ type: 'float', default: 0 })
  feedCostTotal!: number;

  @Column({ type: 'float', default: 0 })
  revenueTotal!: number;

  @Column({ type: 'float', default: 0 })
  netProfit!: number;

  @Column({ type: 'float', default: 0 })
  roiPercent!: number;

  // ── CLOSURE METRICS ───────────────────────────────────────────────────────

  @Column({ type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  depletionReason!: string | null;

  @Column({ type: 'float', nullable: true })
  finalMortalityPercent!: number | null;

  /**
   * Final culling % at closure — separated from mortality.
   * NEW field: previously culls and mortality were always summed together,
   * which hid whether losses were disease-driven (mortality) or a
   * deliberate management decision (culling weak/sick birds).
   */
  @Column({ type: 'float', nullable: true })
  finalCullingPercent!: number | null;

  /** Broilers only — see PoultryService.calculateFCR() for the fixed formula */
  @Column({ type: 'float', nullable: true })
  feedConversionRatio!: number | null;

  /**
   * Layers/kienyeji — feed kg consumed per dozen eggs produced.
   * NEW field: the layer-equivalent of FCR. Previously layers had no
   * feed-efficiency metric at all.
   */
  @Column({ type: 'float', nullable: true })
  feedPerDozenEggs!: number | null;

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

  /**
   * Egg sales — NEW. Previously there was no transactional record of egg
   * sales at all; egg revenue was only ever an automatic daily KPI
   * side-effect with no buyer, receipt, or payment status tracking.
   */
  @Column({ type: 'jsonb', nullable: true })
  eggSales!: {
    buyer: string;
    trays: number;
    pricePerTray: number;
    totalAmount: number;
    saleDate: Date;
    receiptNumber?: string;
    paymentStatus: 'pending' | 'paid' | 'partial';
    notes?: string;
  }[];

  @OneToMany(() => FlockRecord, (record) => record.flock, { cascade: true })
  records!: FlockRecord[];
}