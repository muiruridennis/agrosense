import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';

export enum RecommendationCategory {
  DISEASE = 'disease',
  WEATHER = 'weather',
  PLANTING = 'planting',
  HARVESTING = 'harvesting',
  VACCINATION = 'vaccination',
  NUTRITION = 'nutrition',
  GENERAL = 'general',
}

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('recommendations')
export class Recommendation extends BaseEntity {
  @Column({ type: 'enum', enum: RecommendationCategory })
  category!: RecommendationCategory;

  @Column({
    type: 'enum',
    enum: RecommendationPriority,
    default: RecommendationPriority.MEDIUM,
  })
  priority!: RecommendationPriority;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  message!: string; // pre-formatted, SMS-safe plain text

  @Column({ type: 'simple-array', nullable: true })
  actions!: string[] | null; // short action items

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'boolean', default: false })
  isDismissed!: boolean;

  // Link to source alert if generated from disease engine
  @Column({ type: 'uuid', nullable: true })
  sourceAlertId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Index()
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, (farm) => farm.recommendations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;
}
