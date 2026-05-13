import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { StockItem } from './stock-item.entity';
import { StockAdjustmentReason } from '../enums/stock.enums';

@Entity('stock_adjustments')
@Index('idx_stock_adjustment_farm_date', ['farmId', 'adjustmentDate'])
@Index('idx_stock_adjustment_item', ['itemId'])
export class StockAdjustment extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem, (item) => item.adjustments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itemId' })
  item!: StockItem;

  @Column({ type: 'date' })
  adjustmentDate!: Date;

  @Column({ type: 'float' })
  quantityAdjusted!: number;

  @Column({ type: 'enum', enum: StockAdjustmentReason })
  reason!: StockAdjustmentReason;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', nullable: true })
  approvedBy!: string | null;

  @Column({ type: 'varchar', nullable: true })
  recordedBy!: string | null;
}