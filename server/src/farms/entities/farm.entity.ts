import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

export type GeoPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

@Entity('farms')
@Unique(['ownerId', 'name'])
export class Farm extends BaseEntity {

  @Column({ type: 'varchar', length: 150 })
  name!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // ─────────────────────────────────────────────────────────────────────────
  // LOCATION
  // ─────────────────────────────────────────────────────────────────────────

  @Column({ type: 'varchar', length: 100 })
  country!: string;

  @Column({ type: 'varchar', length: 100 })
  region!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subRegion!: string | null;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geoPoint!: GeoPoint | null;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  boundary!: GeoPolygon | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'Africa/Nairobi',
  })
  timezone!: string;

  // ─────────────────────────────────────────────────────────────────────────
  // PHYSICAL INFORMATION
  // ─────────────────────────────────────────────────────────────────────────

  @Column({
    type: 'float',
    nullable: true,
  })
  areaHectares!: number | null;

  // ─────────────────────────────────────────────────────────────────────────
  // OWNERSHIP
  // ─────────────────────────────────────────────────────────────────────────

  @Column({ type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.farms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;
}