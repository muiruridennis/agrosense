// src/financial/entities/cost-entry.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { CostCategory } from '../enums/cost-category.enum';

@Entity('cost_entries')
@Index('idx_cost_farm_date', ['farmId', 'incurredDate'])
@Index('idx_cost_category', ['farmId', 'category'])
export class CostEntry extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'enum', enum: CostCategory })
  category!: CostCategory;

  @Column({ type: 'varchar', length: 150 })
  description!: string;

  @Column({ type: 'date' })
  incurredDate!: Date;

  @Column({ type: 'float' })
  quantity!: number;

  @Column({ type: 'varchar', length: 50 })
  unit!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitCost!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCost!: number;

  @Column({ type: 'uuid', nullable: true })
  relatedInventoryPurchaseId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  relatedInventoryConsumptionId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  relatedHealthEventId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  relatedAnimalId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  supplier!: string | null;

  @Column({ type: 'varchar', nullable: true })
  invoiceNumber!: string | null;

  @Column({ type: 'boolean', default: false })
  isPaid!: boolean;

  @Column({ type: 'date', nullable: true })
  paidDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', nullable: true })
  recordedBy!: string | null;
}
