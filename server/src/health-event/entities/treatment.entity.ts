// health-event/entities/treatment.entity.ts
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
import { HealthEvent } from './health-event.entity';
import { TreatmentRoute } from '../enums/treatment-route.enum';

export enum TreatmentResponseStatus {
  PENDING = 'pending',
  IMPROVING = 'improving',
  NO_CHANGE = 'no_change',
  WORSENING = 'worsening',
}

export enum TreatmentCostSource {
  INVENTORY = 'inventory',
  MANUAL = 'manual',
  ESTIMATED = 'estimated',
  VET_SERVICE = 'vet_service',
  SUPPLIER_CREDIT = 'supplier_credit',
  COOPERATIVE = 'cooperative',
}

export enum ProcurementSource {
  INVENTORY = 'inventory',
  EXTERNAL_PURCHASE = 'external_purchase',
  VET_SUPPLIED = 'vet_supplied',
  COOPERATIVE = 'cooperative',
  DONATION = 'donation',
}

@Entity('treatments')
@Index('idx_treatment_health_event', ['healthEventId'])
@Index('idx_treatment_medication', ['medicationId'])
@Index('idx_treatment_administered', ['administeredAt'])
@Index('idx_treatment_cost_source', ['costSource'])
@Index('idx_treatment_procurement', ['procurementSource'])
export class Treatment extends BaseEntity {
  @Column({ type: 'uuid' })
  healthEventId!: string;

  @ManyToOne(() => HealthEvent, (event) => event.treatments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'healthEventId' })
  healthEvent!: HealthEvent;

  // ──────────────────────────────────────────────────────────────────
  // MEDICATION DETAILS
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'uuid', nullable: true })
  medicationId!: string | null;

  @Column({ type: 'varchar', length: 150 })
  medicationName!: string;

  @Column({ type: 'float' })
  dosage!: number;

  @Column({ type: 'varchar', length: 20 })
  unit!: string;

  @Column({ type: 'enum', enum: TreatmentRoute })
  route!: TreatmentRoute;

  @Column({ type: 'int' })
  durationDays!: number;

  @Column({ type: 'int', default: 1 })
  frequencyPerDay!: number;

  // ──────────────────────────────────────────────────────────────────
  // ADMINISTRATION
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'timestamptz' })
  administeredAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  administeredBy!: string | null;

  @Column({ type: 'varchar', nullable: true })
  batchNumber!: string | null;

  @Column({ type: 'date', nullable: true })
  expiryDate!: Date | null;

  // ──────────────────────────────────────────────────────────────────
  // COST & PROCUREMENT SOURCE
  // ──────────────────────────────────────────────────────────────────

  @Column({
    type: 'enum',
    enum: TreatmentCostSource,
    default: TreatmentCostSource.MANUAL,
  })
  costSource!: TreatmentCostSource;

  @Column({
    type: 'enum',
    enum: ProcurementSource,
    default: ProcurementSource.EXTERNAL_PURCHASE,
  })
  procurementSource!: ProcurementSource;

  // Manual cost entry
  @Column({ type: 'float', nullable: true })
  manualUnitCost!: number | null;

  @Column({ type: 'float', nullable: true })
  manualTotalCost!: number | null;

  @Column({ type: 'float', nullable: true })
  vetConsultationFee!: number | null;

  // Supplier info
  @Column({ type: 'varchar', length: 150, nullable: true })
  supplierName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptReference!: string | null;

  // Actual costs
  @Column({ type: 'float', nullable: true })
  actualMedicationCost!: number | null;

  @Column({ type: 'float', nullable: true })
  actualServiceCost!: number | null;

  @Column({ type: 'float', nullable: true })
  actualTotalCost!: number | null;

  @Column({ type: 'text', nullable: true })
  costNotes!: string | null;

  // Subsidy tracking
  @Column({ type: 'float', nullable: true })
  subsidyAmount!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subsidySource!: string | null;

  @Column({ type: 'boolean', default: false })
  isSubsidized!: boolean;

  // ──────────────────────────────────────────────────────────────────
  // WITHDRAWAL PERIOD
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'int', nullable: true })
  withdrawalPeriodDays!: number | null;

  @Column({ type: 'date', nullable: true })
  withdrawalEndsAt!: Date | null;

  // ──────────────────────────────────────────────────────────────────
  // RESPONSE TRACKING
  // ──────────────────────────────────────────────────────────────────

  @Column({
    type: 'enum',
    enum: TreatmentResponseStatus,
    default: TreatmentResponseStatus.PENDING,
  })
  responseStatus!: TreatmentResponseStatus;

  @Column({ type: 'timestamptz', nullable: true })
  responseAssessedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  responseNotes!: string | null;

  @Column({ type: 'boolean', default: false })
  wasSwitched!: boolean;

  // ──────────────────────────────────────────────────────────────────
  // NOTES
  // ──────────────────────────────────────────────────────────────────

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ──────────────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ──────────────────────────────────────────────────────────────────

  @BeforeInsert()
  @BeforeUpdate()
  calculateWithdrawalEndDate() {
    if (this.withdrawalPeriodDays && !this.withdrawalEndsAt) {
      this.withdrawalEndsAt = new Date(this.administeredAt);
      this.withdrawalEndsAt.setDate(
        this.withdrawalEndsAt.getDate() + this.withdrawalPeriodDays,
      );
    }

    if (this.administeredAt && !(this.administeredAt instanceof Date)) {
      this.administeredAt = new Date(this.administeredAt);
    }
    if (this.expiryDate && !(this.expiryDate instanceof Date)) {
      this.expiryDate = new Date(this.expiryDate);
    }
    if (this.withdrawalEndsAt && !(this.withdrawalEndsAt instanceof Date)) {
      this.withdrawalEndsAt = new Date(this.withdrawalEndsAt);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ──────────────────────────────────────────────────────────────────

  getTotalDosage(): number {
    return this.dosage * this.durationDays * this.frequencyPerDay;
  }

  getTotalCost(): number {
    if (this.actualTotalCost !== null) return this.actualTotalCost;
    if (this.manualTotalCost !== null) return this.manualTotalCost;
    if (this.vetConsultationFee !== null) return this.vetConsultationFee;
    return 0;
  }

  getEffectiveCost(): number {
    let cost = this.getTotalCost();
    if (this.isSubsidized && this.subsidyAmount) {
      cost -= this.subsidyAmount;
    }
    return Math.max(0, cost);
  }

  isWithdrawalActive(): boolean {
    if (!this.withdrawalEndsAt) return false;
    return new Date() < new Date(this.withdrawalEndsAt);
  }

  getWithdrawalDaysRemaining(): number | null {
    if (!this.withdrawalEndsAt || !this.isWithdrawalActive()) return null;
    const now = new Date();
    const end = new Date(this.withdrawalEndsAt);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > new Date(this.expiryDate);
  }

  getCostBreakdown(): {
    medicationCost: number;
    serviceCost: number;
    totalCost: number;
    effectiveCost: number;
    subsidy: number;
    source: string;
  } {
    return {
      medicationCost: this.actualMedicationCost || 0,
      serviceCost: this.actualServiceCost || 0,
      totalCost: this.getTotalCost(),
      effectiveCost: this.getEffectiveCost(),
      subsidy: this.subsidyAmount || 0,
      source: this.costSource,
    };
  }
}
