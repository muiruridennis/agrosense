import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import type { DiseaseRecommendation } from './disease-rule.entity';
import { DiseaseSeverity, RuleHostType } from './disease-rule.entity';
@Entity('disease_alerts')
export class DiseaseAlert extends BaseEntity {
  @Column({ type: 'varchar' })
  diseaseName!: string;

  @Column({ type: 'enum', enum: RuleHostType })
  hostType!: RuleHostType;

  @Column({ type: 'varchar', nullable: true })
  hostTarget!: string | null;

  @Column({ type: 'enum', enum: DiseaseSeverity })
  severity!: DiseaseSeverity;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb' })
  recommendations!: DiseaseRecommendation;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'boolean', default: false })
  isResolved!: boolean;

  @Column({ type: 'uuid', nullable: true })
  ruleId!: string | null;

  // What triggered this — weather snapshot at time of alert
  @Column({ type: 'jsonb', nullable: true })
  triggerContext!: Record<string, unknown> | null;

  @Index()
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  triggeredAt!: Date;

  @Index()
  @Column({ type: 'uuid' })
  farmId!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  animalId!: string | null; // For livestock alerts - which specific animal

  @ManyToOne(() => Farm, (farm) => farm.diseaseAlerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;
}
