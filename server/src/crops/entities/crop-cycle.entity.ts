import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Plot } from '../../plots/entities/plot.entity';

export enum CropStage {
  SEEDLING = 'seedling',
  VEGETATIVE = 'vegetative',
  FLOWERING = 'flowering',
  FRUITING = 'fruiting',
  RIPENING = 'ripening',
  HARVESTED = 'harvested',
}

export enum CropCycleStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('crop_cycles')
export class CropCycle extends BaseEntity {
  @Index()
  @Column({ type: 'varchar' })
  cropType!: string; // e.g. 'maize', 'beans', 'tomato'

  @Column({ type: 'varchar', nullable: true })
  variety!: string | null; // e.g. 'H614D', 'DK8031'

  @Column({ type: 'date' })
  plantedAt!: Date;

  @Column({ type: 'date', nullable: true })
  expectedHarvestAt!: Date | null;

  @Column({ type: 'date', nullable: true })
  actualHarvestAt!: Date | null;

  @Column({ type: 'float', nullable: true })
  yieldKg!: number | null;

  @Column({ type: 'float', nullable: true })
  expectedYieldKg!: number | null;

  @Column({ type: 'enum', enum: CropStage, default: CropStage.SEEDLING })
  currentStage!: CropStage;

  @Column({
    type: 'enum',
    enum: CropCycleStatus,
    default: CropCycleStatus.ACTIVE,
  })
  status!: CropCycleStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  metadata!: Record<string, unknown> | null; // irrigation type, seed source, etc.

  @Column({ type: 'uuid' })
  plotId!: string;

  @ManyToOne(() => Plot, (plot) => plot.cropCycles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plotId' })
  plot!: Plot;
}
