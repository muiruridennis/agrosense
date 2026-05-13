import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { StockItem } from './stock-item.entity';

@Entity('stock_purchases')
@Index('idx_stock_purchase_farm_date', ['farmId', 'purchaseDate'])
@Index('idx_stock_purchase_item', ['itemId'])
export class StockPurchase extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem, (item) => item.purchases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itemId' })
  item!: StockItem;

  @Column({ type: 'timestamptz' })
  purchaseDate!: Date;

  @Column({ type: 'float' })
  quantity!: number;

  @Column({ type: 'float' })
  costPerUnit!: number;

  @Column({ type: 'float' })
  totalCost!: number;

  @Column({ type: 'varchar', length: 150 })
  supplierName!: string;

  @Column({ type: 'varchar', nullable: true })
  supplierPhone!: string | null;

  @Column({ type: 'varchar', nullable: true })
  batchNumber!: string | null;

  @Column({ type: 'date', nullable: true })
  expiryDate!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryDate!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  invoiceNumber!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  qualityCheck!: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', nullable: true })
  recordedBy!: string | null;
}