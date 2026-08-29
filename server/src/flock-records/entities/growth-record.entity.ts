import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { FlockRecord } from './flock-record.entity';

/**
 * Weight/growth tracking — NOT broiler-specific. Layers get periodically
 * weighed to monitor body condition, kienyeji flocks are weighed same as
 * broilers. Naming this after one flock type would have baked a wrong
 * assumption into the schema (see the module discussion this replaced).
 */
@Entity('growth_records')
export class GrowthRecord extends BaseEntity {
  // ─── RELATIONSHIP ──────────────────────────────────────────────────────

  @Column({ type: 'uuid', unique: true })
  flockRecordId!: string;

  @OneToOne(() => FlockRecord, (record) => record.growthRecord, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'flockRecordId' })
  flockRecord!: FlockRecord;

  // ─── WEIGHT ────────────────────────────────────────────────────────────

  /**
   * Average live weight of sampled birds on this record date. Always the
   * resolved raw figure — whether the farmer entered it directly or as
   * totalSampleWeightKg ÷ sampleSize is a GrowthRecordDto input concern,
   * not a storage concern. See resolveAverageWeightKg() in
   * growth-weight.util.ts.
   */
  @Column({ type: 'decimal', precision: 8, scale: 3 })
  averageWeightKg!: number;

  @Column({ type: 'int', nullable: true })
  sampleSize!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}