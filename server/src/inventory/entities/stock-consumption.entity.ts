import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { StockItem } from './stock-item.entity';

@Entity('stock_consumptions')
@Index('idx_stock_consumption_farm_date', ['farmId', 'consumptionDate'])
@Index('idx_stock_consumption_item', ['itemId'])
export class StockConsumption extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'uuid' })
  itemId!: string;

  @ManyToOne(() => StockItem, (item) => item.consumptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itemId' })
  item!: StockItem;

  @Column({ type: 'date' })
  consumptionDate!: Date;

  @Column({ type: 'float' })
  quantity!: number;

  @Column({ type: 'varchar', nullable: true })
  consumptionReason!: string | null;

  @Column({ type: 'varchar', nullable: true })
  recordedBy!: string | null;

  // Related operational records for traceability
  @Column({ type: 'uuid', nullable: true })
  relatedFlockRecordId!: string | null; // Poultry daily record

  @Column({ type: 'uuid', nullable: true })
  relatedDailyLogId!: string | null; // Dairy daily log

  @Column({ type: 'uuid', nullable: true })
  relatedHealthEventId!: string | null; // Health event (treatment)

  @Column({ type: 'uuid', nullable: true })
  relatedBreedingRecordId!: string | null; // Breeding record (supplement)

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
