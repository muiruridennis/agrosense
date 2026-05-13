// src/financial/entities/cash-flow-forecast.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { CostCategory } from '../enums/cost-category.enum';
import { ConfidenceLevel } from '../enums/confidence-level.enum';

@Entity('cash_flow_forecasts')
@Index('idx_forecast_farm', ['farmId'])
export class CashFlowForecast extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'date' })
  forecastDate!: Date;

  @Column({ type: 'date' })
  requiredByDate!: Date;

  @Column({ type: 'enum', enum: CostCategory })
  category!: CostCategory;

  @Column({ type: 'varchar', length: 150 })
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  estimatedAmount!: number;

  @Column({ type: 'enum', enum: ConfidenceLevel, nullable: true })
  confidence!: ConfidenceLevel | null;

  @Column({ type: 'varchar', nullable: true })
  notes!: string | null;

  @Column({ type: 'boolean', default: false })
  isFulfilled!: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualAmount!: number | null;

  @Column({ type: 'varchar', nullable: true })
  recordedBy!: string | null;
}
