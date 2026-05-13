import {
  Column,
  Entity,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TreatmentRoute } from '../enums/treatment-route.enum';
import { AnimalType } from './health-event.entity';
 
@Entity('vaccinations')
@Index('idx_vaccination_animal', ['animalType', 'animalId'])
@Index('idx_vaccination_due', ['nextBoosterDue'])
@Index('idx_vaccination_farm', ['farmId'])
@Index('idx_vaccination_expires', ['immunityExpiresAt'])
export class Vaccination extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;
 
  @Column({ type: 'enum', enum: AnimalType })
  animalType!: AnimalType;
 
  @Column({ type: 'uuid' })
  animalId!: string;
 
  @Column({ type: 'varchar', length: 100 })
  vaccineName!: string;
 
  @Column({ type: 'uuid', nullable: true })
  inventoryItemId!: string | null; // Links to stock_items
 
  @Column({ type: 'varchar', nullable: true })
  batchNumber!: string | null;
 
  @Column({ type: 'varchar', nullable: true })
  manufacturer!: string | null;
 
  @Column({ type: 'date' })
  administeredDate!: Date;
 
  @Column({
    type: 'enum',
    enum: TreatmentRoute,
  })
  route!: TreatmentRoute;
 
  @Column({ type: 'float', nullable: true })
  dosage!: number | null;
 
  @Column({ type: 'varchar', length: 20, nullable: true })
  unit!: string | null;
 
  @Column({ type: 'date', nullable: true })
  nextBoosterDue!: Date | null;
 
  @Column({ type: 'date', nullable: true })
  immunityExpiresAt!: Date | null;
 
  @Column({ type: 'uuid', nullable: true })
  administeredBy!: string | null;
 
  @Column({ type: 'text', nullable: true })
  reaction!: string | null; // Site reaction, side effects
 
  @Column({ type: 'boolean', default: false })
  isBooster!: boolean;
 
  @Column({ type: 'uuid', nullable: true })
  parentVaccinationId!: string | null; // For booster tracking
 
  @Column({ type: 'text', nullable: true })
  notes!: string | null;
 
  @BeforeInsert()
  @BeforeUpdate()
  ensureDatesAreValid() {
    if (this.administeredDate && !(this.administeredDate instanceof Date)) {
      this.administeredDate = new Date(this.administeredDate);
    }
    if (this.nextBoosterDue && !(this.nextBoosterDue instanceof Date)) {
      this.nextBoosterDue = new Date(this.nextBoosterDue);
    }
    if (this.immunityExpiresAt && !(this.immunityExpiresAt instanceof Date)) {
      this.immunityExpiresAt = new Date(this.immunityExpiresAt);
    }
  }
 
  // Helper methods
  isImmunityExpired(): boolean {
    if (!this.immunityExpiresAt) return false;
    return new Date() > new Date(this.immunityExpiresAt);
  }
 
  isBoosterDue(): boolean {
    if (!this.nextBoosterDue) return false;
    return new Date() >= new Date(this.nextBoosterDue);
  }
 
  getDaysUntilBooster(): number | null {
    if (!this.nextBoosterDue) return null;
    const now = new Date();
    const due = new Date(this.nextBoosterDue);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
 
  getDaysUntilImmunityExpires(): number | null {
    if (!this.immunityExpiresAt) return null;
    const now = new Date();
    const expires = new Date(this.immunityExpiresAt);
    const diffTime = expires.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}