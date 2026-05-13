import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Cow } from './cow.entity';

export enum BreedingStatus {
  PENDING = 'pending',           // service recorded, awaiting pregnancy check
  CONFIRMED = 'confirmed',       // pregnancy confirmed by palpation/scan
  UNSUCCESSFUL = 'unsuccessful', // pregnancy did not result (comes back in heat)
}

export enum ServiceType {
  AI = 'ai',           // artificial insemination
  NATURAL = 'natural', // bull mating
}

/**
 * BreedingRecord — tracks one insemination/mating event.
 *
 * Timeline:
 *   serviceDate (day 0): cow inseminated
 *   → 21 days later: first heat check (comes back in heat? → UNSUCCESSFUL)
 *   → 30–35 days: pregnancy palpation/scan (CONFIRMED)
 *   → 280 days: expected birth (calculated as serviceDate + 280)
 *
 * Manager views "Breeding Calendar" to see:
 *   - Which cows are "next to breed" (those ~21 days from heat)
 *   - Which cows are "due to give birth" (look at expectedBirthDate)
 *   - Pregnancy status of recent breedings
 */
@Entity('breeding_records')
@Index('idx_breeding_records_cow', ['cowId'])
@Index('idx_breeding_records_status', ['status'])
@Index('idx_breeding_records_service_date', ['serviceDate'])
export class BreedingRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  cowId!: string;

  @ManyToOne(() => Cow, (cow) => cow.breedingRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cowId' })
  cow!: Cow;

  /**
   * Date the cow was inseminated or mated.
   * Start of this breeding cycle.
   */
  @Column({ type: 'date' })
  serviceDate!: Date;

  /**
   * Which bull was used (if known).
   * For AI: semen ID, breed, or bull name.
   * For natural: bull tag ID or name.
   * Optional (null if not recorded).
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  bullId!: string | null;

  /**
   * Service type: artificial insemination or natural mating.
   * Affects breeding strategy and genetic tracking.
   */
  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.AI,
  })
  serviceType!: ServiceType;

  /**
   * Date pregnancy was confirmed by palpation (15–30 days) or ultrasound scan.
   * Null if not yet checked or if unsuccessful.
   */
  @Column({ type: 'date', nullable: true })
  pregnancyConfirmedDate!: Date | null;

  /**
   * Is the cow currently pregnant?
   * Set to true when pregnancy confirmed.
   * Set to false if she comes back in heat (unsuccessful).
   */
  @Column({ type: 'boolean', default: false })
  isPregnant!: boolean;

  /**
   * Expected birth date.
   * Calculated as serviceDate + 280 days (bovine gestation).
   * Updated only when pregnancy is confirmed.
   * Used by manager to forecast next freshening and coordinate dry-off.
   */
  @Column({ type: 'date', nullable: true })
  expectedBirthDate!: Date | null;

  /**
   * Breeding status: pending (awaiting confirmation), confirmed, or unsuccessful.
   * pending → manager does pregnancy check → confirmed or unsuccessful.
   */
  @Column({
    type: 'enum',
    enum: BreedingStatus,
    default: BreedingStatus.PENDING,
  })
  status!: BreedingStatus;

  /**
   * Notes: outcome of pregnancy check, reason for failure, etc.
   * Example: "Pregnancy confirmed via scan on 2025-12-20"
   *          "Returns to heat 21 days later (unsuccessful service)"
   *          "Aborted on 2025-12-28 (due to infection)"
   */
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ── Timestamps ─────────────────────────────────────────────────────────
  // Inherited from BaseEntity:
  // - id (uuid)
  // - createdAt (timestamptz)
  // - updatedAt (timestamptz)
}