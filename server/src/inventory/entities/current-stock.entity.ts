import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { StockItem } from './stock-item.entity';
import { StockStatus } from '../enums/stock.enums';

@Entity('current_stocks')
@Index('idx_current_stock_farm_item', ['farmId', 'itemId'], { unique: true })
export class CurrentStock extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem, (item) => item.currentStock, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itemId' })
  item!: StockItem;

  @Column({ type: 'float' })
  quantityOnHand!: number;

  @Column({ type: 'timestamptz' })
  lastUpdated!: Date;

  @Column({ type: 'float', nullable: true })
  daysSupply!: number | null;

  @Column({ type: 'date', nullable: true })
  estimatedRunoutDate!: Date | null;

  @Column({ type: 'enum', enum: StockStatus, default: StockStatus.UNKNOWN })
  status!: StockStatus;

  // Latest purchase tracking
  @Column({ type: 'uuid', nullable: true })
  latestPurchaseId!: string | null;

  @Column({ type: 'date', nullable: true })
  latestExpiryDate!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  latestBatchNumber!: string | null;

  // Consumption analytics
  @Column({ type: 'float', nullable: true })
  avgDailyConsumption!: number | null;

  @Column({ type: 'float', nullable: true })
  avgDailyConsumption30Days!: number | null;
}
