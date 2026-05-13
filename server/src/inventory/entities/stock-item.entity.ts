import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { StockCategory, StockUnit } from '../enums/stock.enums';
import { StockPurchase } from './stock-purchase.entity';
import { StockConsumption } from './stock-consumption.entity';
import { StockAdjustment } from './stock-adjustment.entity';
import { CurrentStock } from './current-stock.entity';

@Entity('stock_items')
@Index('idx_stock_item_farm_category', ['farmId', 'category'])
@Index('idx_stock_item_farm_name', ['farmId', 'name'])
export class StockItem extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, (farm) => farm.stockItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'enum', enum: StockCategory })
  category!: StockCategory;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: StockUnit })
  unit!: StockUnit;

  @Column({ type: 'float' })
  minStockLevel!: number;

  @Column({ type: 'float' })
  optimalStockDays!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true })
  notes!: string | null;

  @OneToMany(() => StockPurchase, (purchase) => purchase.item)
  purchases!: StockPurchase[];

  @OneToMany(() => StockConsumption, (consumption) => consumption.item)
  consumptions!: StockConsumption[];

  @OneToMany(() => StockAdjustment, (adjustment) => adjustment.item)
  adjustments!: StockAdjustment[];

  @OneToMany(() => CurrentStock, (current) => current.item)
  currentStock!: CurrentStock[];
}