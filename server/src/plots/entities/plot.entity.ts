import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm, GeoPolygon } from '../../farms/entities/farm.entity';
import { CropCycle } from '../../crops/entities/crop-cycle.entity';

export enum SoilType {
  CLAY = 'clay',
  SANDY = 'sandy',
  LOAMY = 'loamy',
  SILT = 'silt',
  PEAT = 'peat',
  CHALKY = 'chalky',
  UNKNOWN = 'unknown',
}

@Entity('plots')
export class Plot extends BaseEntity {
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'float' })
  areaHectares!: number;

  @Column({ type: 'enum', enum: SoilType, default: SoilType.UNKNOWN })
  soilType!: SoilType;

  @Column({ type: 'float', nullable: true })
  soilPhLevel!: number | null;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  boundary!: GeoPolygon | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, (farm) => farm.plots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @OneToMany(() => CropCycle, (cycle) => cycle.plot, { cascade: true })
  cropCycles!: CropCycle[];
}
