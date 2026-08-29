import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PoultryHouse } from '../../poultry-houses/entities/poultry-house.entity';
import { FlockStatus, FlockStage, FlockType } from '../enums';
import { FlockRecord } from '../../flock-records/entities/flock-record.entity';
import { VaccinationSchedule } from '../../vaccination/entities/vaccination-schedule.entity';
import { VaccinationRecord } from '../../vaccination/entities/vaccination-record.entity';
@Entity('flocks')
export class Flock extends BaseEntity {
  // ─── IDENTITY & LOCATION ──────────────────────────────────────────────
  @Column({ type: 'uuid' })
  houseId!: string;

  @ManyToOne(() => PoultryHouse, (house) => house.flocks, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'houseId' })
  house!: PoultryHouse;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  // ─── BIOLOGICAL IDENTITY ──────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: FlockType,
  })
  type!: FlockType;

  @Column({ type: 'varchar', length: 100 })
  breed!: string;

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: FlockStatus,
    default: FlockStatus.ACTIVE,
  })
  status!: FlockStatus;

  @Column({
    type: 'enum',
    enum: FlockStage,
    default: FlockStage.PLACED,
  })
  stage!: FlockStage;

  // ─── POPULATION ───────────────────────────────────────────────────────
  @Column({ type: 'int' })
  initialCount!: number;

  /**
   * Denormalized projection — updated by flock events.
   * Not independently editable. Derived from: initialCount - mortality - culls - sales
   */
  @Column({ type: 'int' })
  currentCount!: number;

  // ─── TIMING ────────────────────────────────────────────────────────────
  @Column({ type: 'date' })
  placementDate!: Date;

  @Column({ type: 'int', default: 0 })
  ageAtPlacementWeeks!: number;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  closureReason!: string | null;

  // ─── NOTES ─────────────────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ─── RELATIONSHIPS ────────────────────────────────────────────────────
  @OneToMany(() => FlockRecord, (record) => record.flock)
  records!: FlockRecord[];

  @OneToMany(() => VaccinationRecord, (record) => record.flock)
  vaccinationRecords: VaccinationRecord[];

  @OneToMany(() => VaccinationSchedule, (schedule) => schedule.flock)
  vaccinationSchedules: VaccinationSchedule[];
}
