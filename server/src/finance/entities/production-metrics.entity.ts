// src/financial/entities/production-metrics.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';

@Entity('production_metrics')
@Index('idx_metrics_farm_date', ['farmId', 'period'])
export class ProductionMetrics extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'varchar', length: 7 })
  period!: string;

  // Poultry Metrics
  @Column({ type: 'float', nullable: true })
  eggsProduced!: number | null;

  @Column({ type: 'float', nullable: true })
  feedConsumedKg!: number | null;

  @Column({ type: 'float', nullable: true })
  feedConversionRatio!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPerEgg!: number | null;

  @Column({ type: 'float', nullable: true })
  poultryMortality!: number | null;

  // Dairy Metrics
  @Column({ type: 'float', nullable: true })
  milkProducedLitres!: number | null;

  @Column({ type: 'float', nullable: true })
  dairyConcentrateUsedKg!: number | null;

  @Column({ type: 'float', nullable: true })
  concentratePerLiter!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPerLiter!: number | null;

  @Column({ type: 'float', nullable: true })
  dairyMortality!: number | null;

  // Small Ruminant Metrics
  @Column({ type: 'float', nullable: true })
  meatProducedKg!: number | null;

  @Column({ type: 'float', nullable: true })
  ruminantFeedUsedKg!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPerKgMeat!: number | null;

  @Column({ type: 'float', nullable: true })
  ruminantMortality!: number | null;

  // Crop Metrics
  @Column({ type: 'float', nullable: true })
  cropsHarvestedKg!: number | null;

  @Column({ type: 'float', nullable: true })
  cropInputCostKg!: number | null;

  @Column({ type: 'float', nullable: true })
  cropYieldPerHectare!: number | null;

  // Overall
  @Column({ type: 'float', nullable: true })
  overallProductivityScore!: number | null;
}
