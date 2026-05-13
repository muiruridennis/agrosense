// health-event/entities/flock-outbreak.entity.ts
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { HealthEventSeverity, HealthEventStatus } from './health-event.entity';

@Entity('flock_outbreaks')
@Index('idx_outbreak_farm_flock', ['farmId', 'flockId'])
@Index('idx_outbreak_status', ['status'])
@Index('idx_outbreak_severity', ['severity'])
@Index('idx_outbreak_started', ['startedAt'])
export class FlockOutbreak extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'uuid' })
  flockId!: string; // Links to poultry flock

  @Column({ type: 'varchar', length: 100 })
  condition!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: HealthEventSeverity })
  severity!: HealthEventSeverity;

  @Column({
    type: 'enum',
    enum: HealthEventStatus,
    default: HealthEventStatus.REPORTED,
  })
  status!: HealthEventStatus;

  @Column({ type: 'int' })
  totalBirds!: number; // Flock size at outbreak

  @Column({ type: 'int' })
  affectedCount!: number;

  @Column({ type: 'int', default: 0 })
  mortalityCount!: number;

  @Column({ type: 'float', nullable: true })
  mortalityRate!: number; // (mortalityCount / totalBirds) * 100

  @Column({ type: 'float', nullable: true })
  productionDropPercent!: number | null; // Egg production drop

  @Column({ type: 'date' })
  startedAt!: Date;

  @Column({ type: 'date', nullable: true })
  resolvedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  primaryTreatmentId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  quarantineZones!: string[] | null;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', nullable: true })
  recordedBy!: string | null;

  // ──────────────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ──────────────────────────────────────────────────────────────────

  @BeforeInsert()
  @BeforeUpdate()
  calculateMortalityRate() {
    if (this.totalBirds > 0) {
      this.mortalityRate = (this.mortalityCount / this.totalBirds) * 100;
    }

    // Ensure dates are valid
    if (this.startedAt && !(this.startedAt instanceof Date)) {
      this.startedAt = new Date(this.startedAt);
    }
    if (this.resolvedAt && !(this.resolvedAt instanceof Date)) {
      this.resolvedAt = new Date(this.resolvedAt);
    }

    // Auto-update severity based on mortality
    if (this.mortalityRate >= 20) {
      this.severity = HealthEventSeverity.CRITICAL;
    } else if (this.mortalityRate >= 10) {
      this.severity = HealthEventSeverity.HIGH;
    } else if (this.mortalityRate >= 5) {
      this.severity = HealthEventSeverity.MEDIUM;
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ──────────────────────────────────────────────────────────────────

  getAffectedPercentage(): number {
    if (this.totalBirds === 0) return 0;
    return (this.affectedCount / this.totalBirds) * 100;
  }

  getDurationDays(): number | null {
    if (!this.startedAt) return null;
    const endDate = this.resolvedAt || new Date();
    const start = new Date(this.startedAt);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isActive(): boolean {
    return this.status !== HealthEventStatus.RESOLVED && !this.isDeleted;
  }

  getImpactSummary(): {
    affected: number;
    mortality: number;
    productionLoss: number;
  } {
    return {
      affected: this.affectedCount,
      mortality: this.mortalityCount,
      productionLoss: this.productionDropPercent || 0,
    };
  }
}