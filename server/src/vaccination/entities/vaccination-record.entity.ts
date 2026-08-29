import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Flock } from '../../flock/entities/flock.entity';
import { VaccinationRoute } from '../enums/vaccination-route.enum';
import { BaseEntity } from '../../common/entities/base.entity';
import { VaccinationSchedule } from './vaccination-schedule.entity';

@Entity('vaccination_records')
export class VaccinationRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  flockId: string;

  @ManyToOne(() => Flock, (flock) => flock.vaccinationRecords, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'flockId' })
  flock: Flock;

  @Column({ type: 'uuid', nullable: true })
  scheduleId: string | null;

  @ManyToOne(
    () => VaccinationSchedule,
    (schedule) => schedule.vaccinationRecords,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'scheduleId' })
  schedule: VaccinationSchedule | null;

  @Column({ type: 'varchar', length: 150 })
  vaccineName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  targetDisease: string | null;

  @Column({ type: 'date' })
  vaccinationDate: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  dose!: string | null;

  @Column({
    type: 'enum',
    enum: VaccinationRoute,
    default: VaccinationRoute.OTHER,
  })
  route: VaccinationRoute;

  @Column({ type: 'int' })
  birdsVaccinated: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batchNumber: string | null;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  administeredBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
