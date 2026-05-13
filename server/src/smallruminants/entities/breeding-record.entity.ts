import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Ruminant } from './ruminant.entity';

export enum RuminantBreedingStatus {
  PENDING = 'pending',           // service recorded, awaiting pregnancy check
  CONFIRMED = 'confirmed',       // pregnant confirmed
  UNSUCCESSFUL = 'unsuccessful', // came back in heat
}

/**
 * BreedingRecord — tracks mating/breeding events for ruminants.
 *
 * Simpler than dairy cattle:
 * - No AI (mostly natural mating)
 * - Shorter gestation: ~150 days (vs 280 for cattle)
 * - High fertility: usually confirm pregnant easily
 *
 * Timeline:
 *   Day 0: Mating/service recorded
 *   Day 35: Pregnancy palpation (can feel kids/lambs)
 *   Day 150: Expected birth (kidding/lambing)
 */
@Entity('ruminant_breeding_records')
@Index('idx_ruminant_breeding_ruminant', ['ruminantId'])
@Index('idx_ruminant_breeding_status', ['status'])
export class BreedingRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  ruminantId!: string;

  @ManyToOne(() => Ruminant, (ruminant) => ruminant.breedingRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ruminantId' })
  ruminant!: Ruminant;

  /**
   * Date mated or inseminated (if any).
   */
  @Column({ type: 'date' })
  serviceDate!: Date;

  /**
   * Which male (buck/ram) was used?
   * Tag ID or name.
   * Null if unknown.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  maleId!: string | null;

  /**
   * Date pregnancy was confirmed (palpation at ~35 days).
   * Null if not checked yet or unsuccessful.
   */
  @Column({ type: 'date', nullable: true })
  pregnancyConfirmedDate!: Date | null;

  /**
   * Is currently pregnant?
   */
  @Column({ type: 'boolean', default: false })
  isPregnant!: boolean;

  /**
   * Expected birth date.
   * Calculated: serviceDate + 150 days for goats/sheep.
   */
  @Column({ type: 'date', nullable: true })
  expectedBirthDate!: Date | null;

  /**
   * Breeding status: pending, confirmed, unsuccessful.
   */
  @Column({
    type: 'enum',
    enum: RuminantBreedingStatus,
    default: RuminantBreedingStatus.PENDING,
  })
  status!: RuminantBreedingStatus;

  /**
   * Number of kids/lambs expected (if known from scan).
   * Null if unknown.
   */
  @Column({ type: 'int', nullable: true })
  expectedOffspring!: number | null;

  /**
   * Notes: outcome, abortion, health issues, etc.
   */
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ── Timestamps ─────────────────────────────────────────────────────────
  // Inherited from BaseEntity:
  // - id (uuid)
  // - createdAt (timestamptz)
  // - updatedAt (timestamptz)
}