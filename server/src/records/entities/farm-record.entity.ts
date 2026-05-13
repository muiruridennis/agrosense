import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';

export enum RecordType {
  EXPENSE = 'expense',
  INCOME = 'income',
  TREATMENT = 'treatment',
  FEED = 'feed',
  HARVEST = 'harvest',
  LABOR = 'labor',
  EQUIPMENT = 'equipment',
}

export enum RecordCategory {
  // Expense categories
  SEED = 'seed',
  FERTILIZER = 'fertilizer',
  PESTICIDE = 'pesticide',
  IRRIGATION = 'irrigation',
  VETERINARY = 'veterinary',
  ANIMAL_FEED = 'animal_feed',
  TRANSPORT = 'transport',
  STORAGE = 'storage',
  LABOR = 'labor',
  EQUIPMENT = 'equipment',
  OTHER_EXPENSE = 'other_expense',
  // Income categories
  CROP_SALE = 'crop_sale',
  LIVESTOCK_SALE = 'livestock_sale',
  DAIRY = 'dairy',
  EGGS = 'eggs',
  OTHER_INCOME = 'other_income',
}

@Entity('farm_records')
export class FarmRecord extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: RecordType })
  recordType!: RecordType;

  @Index()
  @Column({ type: 'enum', enum: RecordCategory })
  category!: RecordCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'KES' })
  currency!: string;

  @Index()
  @Column({ type: 'date' })
  recordedAt!: Date;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // Optional links to source entities for traceability
  @Column({ type: 'uuid', nullable: true })
  cropCycleId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  animalId!: string | null;

  // Flexible extra fields — quantity, unit, supplier, buyer, etc.
  @Column({ type: 'jsonb', nullable: true, default: null })
  metadata!: Record<string, unknown> | null;

  // Client-generated UUID for offline idempotency
  @Index({ unique: true })
  @Column({ type: 'uuid', nullable: true })
  clientId!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, (farm) => farm.records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  // Soft delete support for audit trails and referential integrity
  @Index('idx_farm_records_deleted')
  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
