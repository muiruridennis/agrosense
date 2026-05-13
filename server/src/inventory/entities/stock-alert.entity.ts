import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { StockItem } from './stock-item.entity';
import { StockAlertSeverity, StockAlertType } from '../enums/stock.enums';

@Entity('stock_alerts')
@Index('idx_stock_alert_farm_status', ['farmId', 'alertStatus'])
export class StockAlert extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item!: StockItem;

  @Column({ type: 'enum', enum: StockAlertType })
  alertType!: StockAlertType;

  @Column({ type: 'varchar', length: 200 })
  message!: string;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @Column({
    type: 'enum',
    enum: StockAlertSeverity,
    default: StockAlertSeverity.WARNING,
  })
  severity!: StockAlertSeverity;

  @Column({
    type: 'enum',
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active',
  })
  alertStatus!: 'active' | 'acknowledged' | 'resolved';

  // Acknowledgment tracking
  @Column({ type: 'timestamptz', nullable: true })
  acknowledgedAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  acknowledgedBy!: string | null;

  // Resolution tracking
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  resolutionNotes!: string | null;
}
