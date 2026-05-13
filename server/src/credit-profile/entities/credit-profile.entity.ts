// src/credit-profile/entities/credit-profile.entity.ts
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';

export enum CreditRating {
  UNRATED = 'unrated',
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  EXCELLENT = 'excellent',
}

@Entity('credit_profiles')
export class CreditProfile extends BaseEntity {
  // One profile per farm — not per user
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  farmId!: string;

  @OneToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  // Computed fields — populated by CreditProfileService
  @Column({ type: 'int', default: 0 })
  score!: number; // 0–100

  @Column({
    type: 'enum',
    enum: CreditRating,
    default: CreditRating.UNRATED,
  })
  rating!: CreditRating;

  @Column({ type: 'int', default: 0 })
  seasonsRecorded!: number; // needs 2+ to be meaningful

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageSeasonalIncome!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageSeasonalExpenses!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageNetProfit!: number;

  @Column({ type: 'float', nullable: true })
  expenseConsistencyScore!: number | null; // variance measure

  @Column({ type: 'float', nullable: true })
  repaymentConsistency!: number | null; // variance measure

  @Column({ type: 'timestamptz', nullable: true })
  lastComputedAt!: Date | null;

  // Raw inputs stored for auditability
  @Column({ type: 'jsonb', nullable: true, default: null })
  computationSnapshot!: Record<string, unknown> | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  annualRevenue!: number;
}