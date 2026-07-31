// pricing/entities/record-pricing-snapshot.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FlockRecord } from '../../poultry/entities/flock-record.entity';
import { PricingTier } from './pricing-tier.entity';

@Entity('record_pricing_snapshots')
@Index(['recordId'])
@Index(['pricingTierId'])
export class RecordPricingSnapshot extends BaseEntity {
  @Column({ type: 'uuid' })
  recordId!: string;

  @ManyToOne(() => FlockRecord)
  @JoinColumn({ name: 'recordId' })
  record!: FlockRecord;

  @Column({ type: 'uuid' })
  pricingTierId!: string;

  @ManyToOne(() => PricingTier)
  @JoinColumn({ name: 'pricingTierId' })
  pricingTier!: PricingTier;

  // ═══════════════════════════════════════════════════════════════════════════
  // SNAPSHOT: Exact values used for this record
  // ═══════════════════════════════════════════════════════════════════════════

  // ✅ Use decimal with precision/scale
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  feedCostPerKg!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  eggPricePerTray!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  broilerPricePerKg!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  mortalityCostPerBird!: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCIAL CALCULATIONS (for audit)
  // ═══════════════════════════════════════════════════════════════════════════

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  calculatedFeedCost!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  calculatedEggRevenue!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  calculatedMortalityCost!: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  @Column({ type: 'timestamptz' })
  capturedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}