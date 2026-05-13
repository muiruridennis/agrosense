// src/financial/entities/revenue-entry.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { RevenueCategory } from '../enums/revenue-category.enum';

@Entity('revenue_entries')
@Index('idx_revenue_farm_date', ['farmId', 'soldDate'])
@Index('idx_revenue_category', ['farmId', 'category'])
export class RevenueEntry extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'enum', enum: RevenueCategory })
  category!: RevenueCategory;

  @Column({ type: 'varchar', length: 150 })
  description!: string;

  @Column({ type: 'date' })
  soldDate!: Date;

  @Column({ type: 'float' })
  quantity!: number;

  @Column({ type: 'varchar', length: 50 })
  unit!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue!: number;

  @Column({ type: 'varchar', nullable: true })
  buyer!: string | null;

  @Column({ type: 'varchar', nullable: true })
  receiptNumber!: string | null;

  @Column({ type: 'uuid', nullable: true })
  relatedProductionLogId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  relatedAnimalId!: string | null;

  @Column({ type: 'boolean', default: false })
  isPaid!: boolean;

  @Column({ type: 'date', nullable: true })
  paidDate!: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amountPaid!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', nullable: true })
  recordedBy!: string | null;
}
