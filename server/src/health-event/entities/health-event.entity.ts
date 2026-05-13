// health-event/entities/health-event.entity.ts
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { Treatment } from './treatment.entity';
import { Diagnostic } from './diagnostic.entity';
import { Withdrawal } from './withdrawal.entity';
import { Quarantine } from './quarantine.entity';

export enum AnimalType {
  COW = 'cow',
  RUMINANT = 'ruminant',
  POULTRY = 'poultry',
}

export enum HealthEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum HealthEventStatus {
  REPORTED = 'reported',
  UNDER_TREATMENT = 'under_treatment',
  MONITORING = 'monitoring',
  RESOLVED = 'resolved',
  FATAL = 'fatal',
  CHRONIC = 'chronic',
}

export enum ProductionImpactType {
  MILK = 'milk',
  EGGS = 'eggs',
  GROWTH = 'growth',
  REPRODUCTION = 'reproduction',
}

@Entity('health_events')
@Index('idx_health_farm_animal', ['farmId', 'animalType', 'animalId'])
@Index('idx_health_status_severity', ['status', 'severity'])
@Index('idx_health_occurred', ['occurredDate'])
@Index('idx_health_deleted', ['isDeleted', 'farmId'])
export class HealthEvent extends BaseEntity {
  // ──────────────────────────────────────────────────────────────────
  // FARM & ANIMAL REFERENCE
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'uuid', nullable: true })
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'enum', enum: AnimalType, nullable: true })
  animalType!: AnimalType;

  @Column({ type: 'uuid' })
  animalId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  animalTag!: string | null;

  // ──────────────────────────────────────────────────────────────────
  // EVENT CLASSIFICATION
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'varchar', length: 100, nullable: true })
  condition!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: HealthEventSeverity,
    default: HealthEventSeverity.MEDIUM,
  })
  severity!: HealthEventSeverity;

  @Column({
    type: 'enum',
    enum: HealthEventStatus,
    default: HealthEventStatus.REPORTED,
  })
  status!: HealthEventStatus;

  @Column({ type: 'jsonb', nullable: true })
  symptoms!: string[] | null;

  // ──────────────────────────────────────────────────────────────────
  // TIMELINE
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'date', nullable: true })
  occurredDate!: Date;

  @Column({ type: 'date', nullable: true })
  resolvedDate!: Date | null;

  // ──────────────────────────────────────────────────────────────────
  // CLINICAL MEASUREMENTS
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'float', nullable: true })
  temperatureCelsius!: number | null;

  @Column({ type: 'float', nullable: true })
  weightKg!: number | null;

  @Column({ type: 'int', nullable: true })
  bodyConditionScore!: number | null; // 1-5 scale

  // ──────────────────────────────────────────────────────────────────
  // BREEDING IMPACT
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'boolean', default: false })
  affectsBreeding!: boolean;

  @Column({ type: 'date', nullable: true })
  breedingLockUntil!: Date | null;

  @Column({ type: 'int', nullable: true })
  estimatedCalvingDelayDays!: number | null;

  // ──────────────────────────────────────────────────────────────────
  // PRODUCTION IMPACT
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'jsonb', nullable: true })
  productionImpact!: {
    type: ProductionImpactType;
    normalRate: number;
    affectedRate: number;
    lossQuantity: number;
    lossValue: number;
    recoveryDate?: Date;
  } | null;

  // ──────────────────────────────────────────────────────────────────
  // RELATIONSHIPS
  // ──────────────────────────────────────────────────────────────────

  @OneToMany(() => Treatment, (treatment) => treatment.healthEvent, {
    cascade: true,
    eager: true,
  })
  treatments!: Treatment[];

  @OneToMany(() => Diagnostic, (diagnostic) => diagnostic.healthEvent, {
    cascade: true,
    eager: false,
  })
  diagnostics!: Diagnostic[];

  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.healthEvent, {
    cascade: true,
    eager: true,
  })
  withdrawals!: Withdrawal[];

  @OneToMany(() => Quarantine, (quarantine) => quarantine.healthEvent, {
    cascade: true,
    eager: true,
  })
  quarantines!: Quarantine[];

  @Column({ type: 'uuid', nullable: true })
  flockOutbreakId!: string | null;

  // ──────────────────────────────────────────────────────────────────
  // FINANCIAL IMPACT
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'float', nullable: true })
  totalTreatmentCost!: number | null;

  @Column({ type: 'float', nullable: true })
  totalProductionLossValue!: number | null;

  @Column({ type: 'float', nullable: true })
  totalEconomicImpact!: number | null;

  // ──────────────────────────────────────────────────────────────────
  // SOFT DELETE & AUDIT
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  recordedBy!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ──────────────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ──────────────────────────────────────────────────────────────────

  @BeforeInsert()
  @BeforeUpdate()
  validateAndSetDefaults() {
    // Ensure dates are valid
    if (this.occurredDate && !(this.occurredDate instanceof Date)) {
      this.occurredDate = new Date(this.occurredDate);
    }
    if (this.resolvedDate && !(this.resolvedDate instanceof Date)) {
      this.resolvedDate = new Date(this.resolvedDate);
    }
    if (this.breedingLockUntil && !(this.breedingLockUntil instanceof Date)) {
      this.breedingLockUntil = new Date(this.breedingLockUntil);
    }

    // Set resolved date if status is resolved
    if (
      this.status === HealthEventStatus.RESOLVED &&
      !this.resolvedDate &&
      this.occurredDate
    ) {
      this.resolvedDate = new Date();
    }

    // Set resolved date for fatal events
    if (this.status === HealthEventStatus.FATAL && !this.resolvedDate) {
      this.resolvedDate = this.occurredDate || new Date();
      this.severity = HealthEventSeverity.CRITICAL;
    }

    // Calculate total economic impact
    if (this.totalTreatmentCost !== null || this.totalProductionLossValue !== null) {
      this.totalEconomicImpact =
        (this.totalTreatmentCost || 0) + (this.totalProductionLossValue || 0);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ──────────────────────────────────────────────────────────────────

  getDurationDays(): number | null {
    if (!this.occurredDate) return null;
    const endDate = this.resolvedDate || new Date();
    const start = new Date(this.occurredDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  wasFatal(): boolean {
    return this.status === HealthEventStatus.FATAL;
  }

  isActive(): boolean {
    return (
      this.status !== HealthEventStatus.RESOLVED &&
      this.status !== HealthEventStatus.FATAL &&
      !this.isDeleted
    );
  }

  getImpactDisplay(): string {
    if (!this.totalEconomicImpact) return 'Unknown';
    return `${this.totalEconomicImpact.toFixed(0)} KES`;
  }
}