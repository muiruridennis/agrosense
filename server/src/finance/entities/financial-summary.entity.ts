// src/financial/entities/financial-summary.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { CostCategory } from '../enums/cost-category.enum';
import { RevenueCategory } from '../enums/revenue-category.enum';

@Entity('financial_summaries')
@Index('idx_summary_farm_period', ['farmId', 'period'], { unique: true })
export class FinancialSummary extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'varchar', length: 7 })
  period!: string;

  @Column({ type: 'date' })
  periodStart!: Date;

  @Column({ type: 'date' })
  periodEnd!: Date;

  @Column({ type: 'jsonb', nullable: true })
  costsByCategory!: {
    [key in CostCategory]?: {
      totalQuantity: number;
      totalCost: number;
      unit: string;
      costPerUnit: number;
      entries: number;
    };
  };

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCosts!: number;

  @Column({ type: 'jsonb' })
  revenueByCategory!: {
    [key in RevenueCategory]?: {
      totalQuantity: number;
      totalCost: number;
      unit: string;
      costPerUnit: number;
      entries: number;
    };
  };

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grossProfit!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  profitMargin!: number;

  @Column({ type: 'jsonb', nullable: true })
  animalCounts!: {
    poultry?: number;
    dairy?: number;
    smallRuminants?: number;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  costPerAnimal!: {
    poultry?: number;
    dairy?: number;
    smallRuminants?: number;
  } | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashInflow!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashOutflow!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netCashFlow!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  accountsPayable!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  accountsReceivable!: number;

  @Column({ type: 'timestamptz' })
  calculatedAt!: Date;

  @Column({ type: 'boolean', default: false })
  isDirty!: boolean;

  @Column({ type: 'int', default: 1 })
  version!: number;
}
