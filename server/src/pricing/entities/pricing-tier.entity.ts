// pricing/entities/pricing-tier.entity.ts

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { User } from '../../users/entities/user.entity';
import { RecordPricingSnapshot } from './record-pricing-snapshot.entity';

export enum PricingStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled',
  SUSPENDED = 'suspended',
}

@Entity('pricing_tiers')
@Unique(['farmId', 'version'])
@Index(['farmId', 'status'])
@Index(['farmId', 'effectiveDate'])
export class PricingTier extends BaseEntity {
  // ==========================================================================
  // OWNERSHIP
  // ==========================================================================

  @Column('uuid')
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  // ==========================================================================
  // VERSIONING
  // ==========================================================================

  @Column('int')
  version!: number;

  @Column({
    type: 'enum',
    enum: PricingStatus,
    default: PricingStatus.ACTIVE,
  })
  status!: PricingStatus;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  effectiveDate!: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  archivedDate!: Date | null;

  // ==========================================================================
  // PRICING
  // ==========================================================================

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  feedCostPerKg!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  eggPricePerTray!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  broilerPricePerKg!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  mortalityCostPerBird!: number;

  // Average weight of a day-old chick
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 3,
  })
  dayOldChickWeightKg!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  waterCostPerLitre!: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  electricityCostPerUnit!: number | null;

  // ==========================================================================
  // AUDIT
  // ==========================================================================

  @Column('uuid')
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdByUser!: User;

  @Column({
    type: 'text',
    nullable: true,
  })
  creationReason!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  // ==========================================================================
  // RELATIONSHIPS
  // ==========================================================================

  @OneToMany(
    () => RecordPricingSnapshot,
    (snapshot) => snapshot.pricingTier,
  )
  snapshots!: RecordPricingSnapshot[];
}