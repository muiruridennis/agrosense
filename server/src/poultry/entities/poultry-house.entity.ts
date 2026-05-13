import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { Flock } from './flock.entity';

export enum HouseType {
  OPEN_SIDED   = 'open_sided',   // common in Kenya — natural ventilation
  CLOSED       = 'closed',       // controlled environment
  SEMI_CLOSED  = 'semi_closed',
}

/**
 * PoultryHouse — a physical structure on the farm.
 * One farm has many houses. A house runs one flock at a time
 * but retains history across batches.
 */
@Entity('poultry_houses')
export class PoultryHouse extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

@ManyToOne(() => Farm, (farm) => farm.poultryHouses, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'farmId' })
farm!: Farm;

  /** e.g "House A", "Pen 3", "Layer Unit 1" */
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: HouseType,
    default: HouseType.OPEN_SIDED,
  })
  houseType!: HouseType;

  /** Maximum bird capacity */
  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  /** Whether this house is currently active */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Flock, (flock) => flock.house, { cascade: true })
  flocks!: Flock[];
}
