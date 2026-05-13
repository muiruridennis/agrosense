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
import { GrowthRecord } from './growth-record.entity';
import { BreedingRecord } from './breeding-record.entity';
import { HealthEvent } from '../../health-event/entities/health-event.entity';

export enum RuminantSpecies {
  GOAT = 'goat',
  SHEEP = 'sheep',
}

export enum RuminantSex {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum RuminantStatus {
  ACTIVE = 'active', // on farm
  SOLD = 'sold', // sold for meat or breeding
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred', // moved to another farm
}

export enum RuminantPurpose {
  MEAT = 'meat', // fattening for slaughter
  BREEDING = 'breeding', // kept for genetics
  DAIRY = 'dairy', // milking (goats mainly)
  DUAL = 'dual', // both meat and breeding
}

/**
 * Ruminant — represents a single goat or sheep.
 *
 * Key differences from cattle:
 * - Shorter lifespan: 2–3 years typical (vs 5–8 for cattle)
 * - Faster growth: ready for market at 4–6 months
 * - Simpler tracking: growth milestones, breeding, health events
 * - No lactation cycles (unless dairy goat — future enhancement)
 * - Periodic weighing (not daily)
 *
 * Typical workflow:
 *   Day 0: Born or purchased
 *   Months 1–4: Growth tracking (periodic weighing)
 *   Month 4–6: Ready for market (meat animals)
 *   Or: Kept for breeding (does/ewes)
 *   Days to market: tracked automatically
 */
@Entity('ruminants')
@Index('idx_ruminants_farm', ['farmId'])
@Index('idx_ruminants_species', ['species'])
@Index('idx_ruminants_status', ['status'])
export class Ruminant extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, (farm) => farm.ruminants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  // ── Identity ────────────────────────────────────────────────────────────
  /**
   * Species: goat or sheep.
   * Different breeds/markets/management for each.
   */
  @Column({
    type: 'enum',
    enum: RuminantSpecies,
  })
  species!: RuminantSpecies;

  /**
   * Unique tag ID within farm (e.g. "G001", "S-234", ear tag number).
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  tagId!: string | null;

  /**
   * Optional friendly name (e.g. "Nandi", "Stella").
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  /**
   * Breed (e.g. "Alpine", "Saanen", "Boer", "Dorper", "Merino").
   */
  @Column({ type: 'varchar', length: 100 })
  breed!: string;

  /**
   * Sex: male, female, or unknown.
   */
  @Column({
    type: 'enum',
    enum: RuminantSex,
    default: RuminantSex.UNKNOWN,
  })
  sex!: RuminantSex;

  /**
   * Primary purpose: meat, breeding, dairy, or dual.
   */
  @Column({
    type: 'enum',
    enum: RuminantPurpose,
    default: RuminantPurpose.MEAT,
  })
  purpose!: RuminantPurpose;

  // ── Life cycle ──────────────────────────────────────────────────────────
  /**
   * Date of birth. Used to calculate age.
   */
  @Column({ type: 'date' })
  dateOfBirth!: Date;

  /**
   * Date acquired (brought to farm).
   */
  @Column({ type: 'date' })
  dateAcquired!: Date;

  /**
   * Current status: active, sold, deceased, transferred.
   */
  @Column({
    type: 'enum',
    enum: RuminantStatus,
    default: RuminantStatus.ACTIVE,
  })
  status!: RuminantStatus;

  /**
   * When the animal left the farm (sold/died).
   */
  @Column({ type: 'date', nullable: true })
  dateLeft!: Date | null;

  // ── Physical ────────────────────────────────────────────────────────────
  /**
   * Current weight in kg.
   * Updated periodically from growth records.
   */
  @Column({ type: 'float', nullable: true })
  currentWeightKg!: number | null;

  /**
   * When weight was last measured.
   */
  @Column({ type: 'timestamptz', nullable: true })
  lastWeighedAt!: Date | null;

  // ── Market readiness (for meat animals) ──────────────────────────────────
  /**
   * Target weight for sale (kg).
   * Meat goats: 25–35 kg. Meat sheep: 35–50 kg.
   * Used to estimate days to market.
   */
  @Column({ type: 'float', nullable: true })
  targetWeightKg!: number | null;

  /**
   * Expected market ready date.
   * Calculated from growth trajectory.
   * Null if not a meat animal.
   */
  @Column({ type: 'date', nullable: true })
  expectedMarketDate!: Date | null;

  // ── Breeding state ──────────────────────────────────────────────────────
  /**
   * Is this animal available for breeding?
   * Bucks: yes. Does: yes (except when nursing).
   * Meat animals: no.
   */
  @Column({ type: 'boolean', default: true })
  isBreedable!: boolean;

  /**
   * Expected date of next heat (estrus).
   * Set during breeding cycle tracking.
   * Null if not breeding.
   */
  @Column({ type: 'date', nullable: true })
  expectedNextHeatDate!: Date | null;

  /**
   * Is currently pregnant?
   * Goat/sheep gestation: ~150 days.
   */
  @Column({ type: 'boolean', default: false })
  isPregnant!: boolean;

  /**
   * Expected birth date (if pregnant).
   * Calculated from service date + 150 days.
   */
  @Column({ type: 'date', nullable: true })
  expectedBirthDate!: Date | null;

  // ── Relationships ──────────────────────────────────────────────────────
  /**
   * Periodic growth records (weighing history).
   * One entry per weighing (not daily like milk).
   */
  @OneToMany(() => GrowthRecord, (record) => record.ruminant, {
    cascade: true,
  })
  growthRecords!: GrowthRecord[];

  /**
   * Breeding history (services, pregnancies).
   */
  @OneToMany(() => BreedingRecord, (record) => record.ruminant, {
    cascade: true,
  })
  breedingRecords!: BreedingRecord[];


  // NOTE: Health events are stored in the polymorphic HealthEvent table.
  // Remove direct healthEvents relation to prevent misleading ORM join behavior.

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
