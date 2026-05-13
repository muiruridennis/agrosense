import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { LactationCycle } from './lactation-cycle.entity';
import { BreedingRecord } from './breeding-record.entity';

export enum CowStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  DECEASED = 'deceased',
  CULLED = 'culled',
}

export enum CowType {
  DAIRY = 'dairy',
  BEEF = 'beef',
  DUAL_PURPOSE = 'dual_purpose',
}

/**
 * Cow — represents a single dairy or beef cattle animal.
 * Tracked from acquisition through lifetime: births, lactations, health, breeding.
 * Owner tracks: milk yields, breeding cycles, health events, weight.
 */
@Entity('cows')
@Index('idx_cows_farm', ['farmId'])
@Index('idx_cows_farm_tag', ['farmId', 'tagId'], { unique: true }) // CRITICAL: Unique constraint prevents duplicate tags per farm
@Index('idx_cows_status', ['status'])
export class Cow extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, (farm) => farm.cows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  // ── Identity ────────────────────────────────────────────────────────────
  /**
   * Unique identifier within the farm (e.g. "K001", "K-234", or RFID tag number).
   * Primary lookup key for the farmer.
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  tagId!: string | null;

  /**
   * Optional friendly name (e.g. "Molly", "Nandi").
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  /**
   * Dairy, beef, or dual-purpose cattle.
   * Affects dashboard KPIs and breeding goals.
   */
  @Column({ type: 'enum', enum: CowType })
  type!: CowType;

  /**
   * Breed (e.g. "Friesian", "Jersey", "Sahiwal", "Boran", "Simmental").
   */
  @Column({ type: 'varchar', length: 100 })
  breed!: string;

  // ── Life cycle ──────────────────────────────────────────────────────────
  /**
   * Date of birth. Used to calculate current age.
   * For animals purchased as adults, this is the farmer's estimate.
   */
  @Column({ type: 'date' })
  dateOfBirth!: Date;

  /**
   * Date acquired (brought to the farm).
   * Different from dateOfBirth for adult purchases.
   */
  @Column({ type: 'date' })
  dateAcquired!: Date;

  /**
   * Current status: active on farm, or historical (sold/dead/culled).
   * Soft delete — record is retained for history.
   */
  @Column({
    type: 'enum',
    enum: CowStatus,
    default: CowStatus.ACTIVE,
  })
  status!: CowStatus;

  /**
   * When the cow left the farm (sold, died, culled).
   * Null if still active.
   */
  @Column({ type: 'date', nullable: true })
  dateLeft!: Date | null;

  // ── Physical ────────────────────────────────────────────────────────────
  /**
   * Current weight in kg.
   * Updated periodically from weighing records.
   */
  @Column({ type: 'float', nullable: true })
  currentWeightKg!: number | null;

  /**
   * Timestamp of the most recent weight measurement.
   */
  @Column({ type: 'timestamptz', nullable: true })
  lastWeighedAt!: Date | null;

  // ── Lactation state ────────────────────────────────────────────────────
  /**
   * Lactation number (parity).
   * 1 = first lactation (primiparous), 2 = second lactation, etc.
   * Null = heifer that has never given birth.
   *
   * Incremented each time she freshens (gives birth).
   * Critical for breeding goals and milk yield expectations.
   */
  @Column({ type: 'int', nullable: true })
  lactationNumber!: number | null;

  /**
   * Is she currently in milk?
   * Set to true when lactation cycle starts.
   * Set to false when cycle ends (dry-off).
   *
   * Quick filter for: "which cows are we milking today?"
   */
  @Column({ type: 'boolean', default: false })
  isCurrentlyLactating!: boolean;

  /**
   * Days since freshening (gave birth).
   * Computed from current lactation cycle's freshenDate.
   * Null if not lactating.
   *
   * Typical lactation is 305–310 days.
   */
  @Column({ type: 'int', nullable: true })
  daysInMilk!: number | null;

  /**
   * Expected date of next heat (estrus).
   * Set when a breeding is recorded or inferred from lactation timeline.
   *
   * Used by manager: "which cows are ready to breed this week?"
   */
  @Column({ type: 'date', nullable: true })
  expectedNextHeatDate!: Date | null;

  // ── Relationships ──────────────────────────────────────────────────────
  /**
   * Historical lactation cycles.
   * One entry per freshing (birth).
   * Each cycle contains daily milk yield records.
   */
  @OneToMany(() => LactationCycle, (cycle) => cycle.cow, { cascade: true })
  lactationCycles!: LactationCycle[];

  /**
   * Breeding records.
   * Tracks inseminations, pregnancy status, expected birth dates.
   */
  @OneToMany(() => BreedingRecord, (record) => record.cow, { cascade: true })
  breedingRecords!: BreedingRecord[];

  // NOTE: Health events are stored in polymorphic HealthEvent table
  // No direct relationship needed - query via animalType='cow' and animalId

  // ── Notes ──────────────────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  metadata!: Record<string, unknown> | null;

  // ── Timestamps ─────────────────────────────────────────────────────────
  // Inherited from BaseEntity:
  // - id (uuid)
  // - createdAt (timestamptz)
  // - updatedAt (timestamptz)
}
