import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Flock } from '../../flock/entities/flock.entity';
import { User } from '../../users/entities/user.entity';
import { MedicationStatus } from '../enums/medication-status.enum';
import { MedicationRoute } from '../enums/medication-route.enum';

/**
 * One treatment course — NOT one day's administration. A 5-day antibiotic
 * course is a single MedicationRecord spanning startDate to endDate, not
 * five daily entries. This is a sibling of FlockRecord, not a child of it:
 * a health event has its own lifecycle (started -> ongoing -> completed ->
 * withdrawal -> withdrawal complete), fundamentally different from a daily
 * operational measurement.
 */
@Entity('medication_records')
export class MedicationRecord extends BaseEntity {
  // ─── RELATIONSHIP ──────────────────────────────────────────────────────

  @Column({ type: 'uuid' })
  flockId!: string;

  @ManyToOne(() => Flock, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'flockId' })
  flock!: Flock;

  /** Who logged this — audit trail matters more here than on a daily record */
  @Column({ type: 'uuid' })
  recordedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recordedById' })
  recordedBy!: User;

  // ─── TREATMENT ─────────────────────────────────────────────────────────

  @Column({ type: 'varchar', length: 200 })
  medicationName!: string;

  /** Farmer's own words — deliberately free text, not tied to a diagnosis taxonomy in V1 */
  @Column({ type: 'varchar', length: 500 })
  purpose!: string;

  @Column({ type: 'date' })
  startDate!: Date;

  /**
   * NULL while the course is ACTIVE — this is the date dosing actually
   * stopped, not a planned/expected end date. Set when the record
   * transitions to COMPLETED or CANCELLED (see MedicationService). All
   * withdrawal math runs off THIS date, regardless of status — a
   * cancelled course still carries a withdrawal period from whenever
   * dosing actually stopped.
   */
  @Column({ type: 'date', nullable: true })
  endDate!: Date | null;

  /** Free text — units and conventions vary too much to structure in V1 */
  @Column({ type: 'varchar', length: 200 })
  dosage!: string;

  @Column({ type: 'varchar', length: 200 })
  frequency!: string;

  @Column({ type: 'enum', enum: MedicationRoute })
  route!: MedicationRoute;

  /**
   * Informational only — how many birds were actually dosed. NEVER used to
   * scope the withdrawal period down to a subset of the flock. In practice
   * treated and untreated birds' eggs/output get pooled into the same
   * stream, so withdrawal applies to the WHOLE flock's output regardless
   * of this number.
   */
  @Column({ type: 'int', nullable: true })
  affectedBirds!: number | null;

  /**
   * Required, not optional — 0 is a legitimate explicit value (e.g.
   * vitamins, electrolytes with no withdrawal requirement). Forcing a
   * deliberate number here beats an ambiguous null on a safety-critical
   * field.
   */
  @Column({ type: 'int' })
  withdrawalPeriodDays!: number;

  @Column({
    type: 'enum',
    enum: MedicationStatus,
    default: MedicationStatus.ACTIVE,
  })
  status!: MedicationStatus;

  /** Required when status becomes CANCELLED — see MedicationService.cancelMedication */
  @Column({ type: 'varchar', length: 500, nullable: true })
  cancelReason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ═══════════════════════════════════════════════════════════════════════
  // VIRTUAL HELPERS — withdrawal state is always derived, never stored
  // ═══════════════════════════════════════════════════════════════════════

  /** Null while treatment is still ongoing — withdrawal hasn't started yet */
  get withdrawalEndDate(): Date | null {
    if (!this.endDate) return null;
    const d = new Date(this.endDate);
    d.setDate(d.getDate() + this.withdrawalPeriodDays);
    return d;
  }

  /** True only once dosing has actually stopped AND the clock hasn't run out yet */
  get isInWithdrawal(): boolean {
    if (!this.endDate || this.withdrawalPeriodDays <= 0) return false;
    return new Date() < this.withdrawalEndDate!;
  }

  get isWithdrawalComplete(): boolean {
    if (!this.endDate) return false; // still ongoing, not "complete" — just not applicable yet
    if (this.withdrawalPeriodDays <= 0) return true;
    return new Date() >= this.withdrawalEndDate!;
  }

  get daysRemainingInWithdrawal(): number {
    if (!this.endDate || this.withdrawalPeriodDays <= 0) return 0;
    const ms = this.withdrawalEndDate!.getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 86_400_000));
  }
}
