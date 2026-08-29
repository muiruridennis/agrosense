// pricing/entities/pricing-history.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PricingTier } from './pricing-tier.entity';
import { User } from '../../users/entities/user.entity';

export enum VersionEvent {
  CREATED = 'created',       // New version created
  ACTIVATED = 'activated',   // Scheduled version became active
  ARCHIVED = 'archived',     // Superseded by next version
  SUSPENDED = 'suspended',   // Temporarily disabled
  RESTORED = 'restored',     // Re-activated after suspension
}

/**
 * PricingHistory: Log of version lifecycle events.
 *
 * NEVER tracks edits to a version (there are none).
 * Only tracks when versions are created, activated, archived, suspended.
 *
 * Example for v3:
 * - 2026-06-26 10:30 - CREATED - feedCost=35, reason="Supplier quote"
 * - 2026-06-26 11:00 - ACTIVATED - became active
 * - 2026-07-01 09:00 - ARCHIVED - superseded by v4
 */
@Entity('pricing_history')
@Index(['pricingTierId', 'eventDate'])
@Index(['farmId', 'eventDate'])
export class PricingHistory extends BaseEntity {
  @Column({ type: 'uuid' })
  pricingTierId!: string;

  @ManyToOne(() => PricingTier, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pricingTierId' })
  pricingTier!: PricingTier;

  @Column({ type: 'uuid' })
  farmId!: string;  // Denormalized for queries

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT
  // ═══════════════════════════════════════════════════════════════════════════

  @Column({ type: 'enum', enum: VersionEvent })
  event!: VersionEvent;  // CREATED, ACTIVATED, ARCHIVED, etc.

  /**
   * When a version is CREATED, what were the prices?
   * (Useful for quick reference without joining to PricingTier)
   */
  @Column({ type: 'jsonb' })
  prices!: {
    feedCostPerKg: number;
    eggPricePerTray: number;
    broilerPricePerKg: number;
    mortalityCostPerBird: number;
  };

  /**
   * For ARCHIVED event: what was the reason?
   * E.g., "Superseded by v4 (supplier renegotiated)"
   */
  @Column({ type: 'text', nullable: true })
  eventReason!: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTOR & CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  @Column({ type: 'uuid' })
  actedBy!: string;  // Who triggered this event?

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actedBy' })
  actedByUser!: User;

  @Column({ type: 'timestamptz' })
  eventDate!: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source!: string | null;  // 'web', 'mobile', 'api', 'import', etc.
}