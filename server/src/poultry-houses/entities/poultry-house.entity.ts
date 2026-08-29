import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { DEFAULT_MINIMUM_REST_DAYS, HouseStatus, HouseType, HousingSystem } from '../enums';
import { Flock } from '../../flock/entities/flock.entity';

@Entity('poultry_houses')
export class PoultryHouse extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  /** e.g "House A", "Pen 3", "Layer Unit 1" */
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: HouseType,
    default: HouseType.OPEN_SIDED,
  })
  houseType!: HouseType;

  @Column({
    type: 'enum',
    enum: HousingSystem,
    default: HousingSystem.DEEP_LITTER,
  })
  housingSystem!: HousingSystem;

  /** Design capacity in birds. FlockModule validates initialCount against this at placement. */
  @Column({ type: 'int' })
  capacity!: number;

  /** Floor area — optional, but enables stocking-density sanity checks once populated */
  @Column({ type: 'float', nullable: true })
  floorAreaSqm!: number | null;

  @Column({
    type: 'enum',
    enum: HouseStatus,
    default: HouseStatus.AVAILABLE,
  })
  status!: HouseStatus;

  /** Free-text audit trail for manual status changes — "roof repair", "converting to broiler house" */
  @Column({ type: 'varchar', length: 500, nullable: true })
  statusReason!: string | null;

  /**
   * Denormalized pointer to whatever flock currently occupies this house —
   * plain uuid, NOT a relation, so PoultryHousesModule never has to import
   * or depend on Flock. Set/cleared exclusively by FlockService.
   */
  @Column({ type: 'uuid', nullable: true })
  currentFlockId!: string | null;

  /** When the last flock was removed. Null means either never occupied, or currently occupied. */
  @Column({ type: 'timestamptz', nullable: true })
  lastDepopulatedAt!: Date | null;

  /**
   * Minimum days a house must sit empty (cleaned + disinfected) before the
   * next flock goes in — breaks the disease cycle between batches. Defaults
   * to 14 but a farmer with a history of disease in a given house may want
   * to set this higher.
   */
  @Column({ type: 'int', default: DEFAULT_MINIMUM_REST_DAYS })
  minimumRestDays!: number;

  /** Lifetime count of flocks placed here — used to block destructive deletes, not just decoration */
  @Column({ type: 'int', default: 0 })
  totalFlocksHosted!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => Flock, (flock) => flock.house, { cascade: true })
  flocks!: Flock[];

  // ═══════════════════════════════════════════════════════════════════════
  // VIRTUAL HELPERS — derived, never persisted separately
  // ═══════════════════════════════════════════════════════════════════════

  /** True if the house has never been occupied, or has cleared its rest period */
  get isRestComplete(): boolean {
    if (!this.lastDepopulatedAt) return true;
    const restEndsAt = new Date(this.lastDepopulatedAt);
    restEndsAt.setDate(restEndsAt.getDate() + this.minimumRestDays);
    return new Date() >= restEndsAt;
  }

  /** Days left on the biosecurity clock — 0 once rest is complete or house was never occupied */
  get daysRemainingInRest(): number {
    if (!this.lastDepopulatedAt) return 0;
    const restEndsAt = new Date(this.lastDepopulatedAt);
    restEndsAt.setDate(restEndsAt.getDate() + this.minimumRestDays);
    const msRemaining = restEndsAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  }
}