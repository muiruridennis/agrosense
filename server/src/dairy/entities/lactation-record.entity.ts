import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LactationCycle } from './lactation-cycle.entity';
import { User } from '../../users/entities/user.entity';

export enum LactationRecordStatus {
  DRAFT = 'draft',       // worker started entry, not ready to submit
  SUBMITTED = 'submitted', // worker submitted, awaiting manager review
  REVIEWED = 'reviewed', // manager approved
}

/**
 * LactationRecord — one daily milk yield entry for a cow during lactation.
 *
 * Workflow: Worker records daily yield → Submits → Manager reviews.
 * Same pattern as FlockRecord in poultry module.
 *
 * Example:
 *   recordDate:      2025-11-16 (day 1 of lactation)
 *   yieldLitres:     12.5
 *   butterfatPercent: 3.8
 *   status:          submitted (awaiting review)
 *
 * Manager can approve or request correction (future: flagging logic).
 */
@Entity('lactation_records')
@Index('idx_lactation_records_cycle', ['lactationCycleId'])
@Index('idx_lactation_records_date', ['recordDate'])
@Index('idx_lactation_records_status', ['status'])
export class LactationRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  lactationCycleId!: string;

  @ManyToOne(() => LactationCycle, (cycle) => cycle.dailyRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lactationCycleId' })
  lactationCycle!: LactationCycle;

  /**
   * The date this record covers (e.g. milk yield from Nov 16).
   */
  @Column({ type: 'date' })
  recordDate!: Date;

  /**
   * Total milk yield in litres for the day.
   * Typically 2× daily (morning + evening milking).
   */
  @Column({ type: 'float' })
  yieldLitres!: number;

  // ── Optional quality metrics ────────────────────────────────────────────
  /**
   * Butterfat percentage.
   * Typical: 3.5–4.5% depending on breed and diet.
   * Affects milk payment (more fat = higher price).
   */
  @Column({ type: 'float', nullable: true })
  butterfatPercent!: number | null;

  /**
   * Protein percentage.
   * Typical: 3.0–3.5%.
   * Affects cheese-making yield and payment.
   */
  @Column({ type: 'float', nullable: true })
  proteinPercent!: number | null;

  /**
   * Somatic cell count (SCC) per mL of milk.
   * < 200,000: healthy milk
   * > 400,000: suspect mastitis or other infection
   * > 1,000,000: definitely infected, milk may be discarded
   *
   * Critical health indicator.
   */
  @Column({ type: 'int', nullable: true })
  somaticCellCount!: number | null;

  // ── Submission & review trail ──────────────────────────────────────────
  /**
   * User who recorded this entry.
   * Typically a farm worker.
   */
  @Column({ type: 'uuid' })
  recordedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recordedById' })
  recordedBy!: User;

  /**
   * When this record was created/submitted.
   */
  @Column({ type: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Status: draft, submitted, or reviewed.
   * Default: draft (worker can save and edit later).
   */
  @Column({
    type: 'enum',
    enum: LactationRecordStatus,
    default: LactationRecordStatus.DRAFT,
  })
  status!: LactationRecordStatus;

  /**
   * Manager who reviewed the record (if status = reviewed).
   */
  @Column({ type: 'uuid', nullable: true })
  reviewedById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy!: User | null;

  /**
   * When the manager reviewed it.
   */
  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  /**
   * Manager's notes or correction request.
   * Future: flagging logic if yield seems anomalous.
   */
  @Column({ type: 'text', nullable: true })
  reviewNote!: string | null;

  // ── Free-form notes ────────────────────────────────────────────────────
  /**
   * Worker remarks: "Cow limping today", "Mastitis treatment started",
   * "Milking machine issue this morning", etc.
   */
  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  // ── Timestamps ─────────────────────────────────────────────────────────
  // Inherited from BaseEntity:
  // - id (uuid)
  // - createdAt (timestamptz) — when this record was created
  // - updatedAt (timestamptz) — when it was last edited
}