import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { Flock } from '../../flock/entities/flock.entity';
import { VaccinationStatus } from '../enums/vaccination-status.enum';
import { BaseEntity } from '../../common/entities/base.entity';
import { VaccinationRecord } from './vaccination-record.entity';

@Entity('vaccination_schedules')
export class VaccinationSchedule extends BaseEntity {
  @Column({ type: 'uuid' })
  flockId: string;

  @ManyToOne(() => Flock, (flock) => flock.vaccinationSchedules, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'flockId' })
  flock: Flock;

  @Column({ type: 'varchar', length: 150 })
  vaccineName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  targetDisease: string | null;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'int', nullable: true })
  recommendedAgeWeeks: number | null;

  @Column({
    type: 'enum',
    enum: VaccinationStatus,
    default: VaccinationStatus.PENDING,
  })
  status: VaccinationStatus;

  @Column({ type: 'int' })
  targetBirds: number;

  @Column({ type: 'int', default: 0 })
  vaccinatedBirds: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(
    () => VaccinationRecord,
    (record) => record.schedule,
  )
  vaccinationRecords: VaccinationRecord[];

  get isFullyVaccinated(): boolean {
    return this.vaccinatedBirds >= this.targetBirds;
  }
}