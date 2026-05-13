// src/financial/entities/budget-line.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { CostCategory } from '../enums/cost-category.enum';

@Entity('budget_lines')
@Index('idx_budget_farm_period', ['farmId', 'period'])
export class BudgetLine extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'varchar', length: 7 })
  period!: string;

  @Column({ type: 'enum', enum: CostCategory })
  category!: CostCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budgetedAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  actualSpent!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  variance!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  variancePercent!: number;

  @Column({ type: 'varchar', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdBy!: string | null;
}
