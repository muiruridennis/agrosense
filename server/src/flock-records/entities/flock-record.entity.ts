import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Flock } from '../../flock/entities/flock.entity';
import { EggCollection } from './egg-collection.entity';
import { GrowthRecord } from './growth-record.entity';

@Entity('flock_records')
@Unique('UQ_flock_record_date', ['flockId', 'recordDate'])
export class FlockRecord extends BaseEntity {
  // ─── RELATIONSHIP ──────────────────────────────────────────────────────

  @Column({ type: 'uuid' })
  flockId!: string;

  @ManyToOne(() => Flock, (flock) => flock.records, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'flockId' })
  flock!: Flock;

  // ─── RECORD DATE ──────────────────────────────────────────────────────

  @Column({ type: 'date' })
  recordDate!: Date;

  // ─── POPULATION ───────────────────────────────────────────────────────

  @Column({ type: 'int', default: 0 })
  mortalityCount!: number;

  @Column({ type: 'int', default: 0 })
  cullingCount!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cullingReason!: string | null;

  // ─── FEED ─────────────────────────────────────────────────────────────

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
  })
  feedConsumedKg!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  feedType!: string | null;

  // ─── WATER ────────────────────────────────────────────────────────────

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  waterConsumedLitres!: number | null;

  @OneToOne(() => EggCollection, (eggCollection) => eggCollection.flockRecord, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  eggCollection!: EggCollection | null;

  @OneToOne(() => GrowthRecord, (growthRecord) => growthRecord.flockRecord, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  growthRecord!: GrowthRecord | null;
  // ─── HEALTH ───────────────────────────────────────────────────────────

  @Column({ type: 'int', default: 0 })
  sickCount!: number;

  @Column({ type: 'text', nullable: true })
  healthNotes!: string | null;

  // ─── ENVIRONMENT ──────────────────────────────────────────────────────

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  houseTemperatureCelsius!: number | null;

  // ─── NOTES ────────────────────────────────────────────────────────────

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
