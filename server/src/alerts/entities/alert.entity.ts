import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

// Use type aliases instead of enums (more flexible for API)
export type AlertType = 'disease' | 'weather' | 'system' | 'advisory';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'dismissed';

// Optional: Keep constants for type safety in code
export const AlertTypes = {
  DISEASE: 'disease' as const,
  WEATHER: 'weather' as const,
  SYSTEM: 'system' as const,
  ADVISORY: 'advisory' as const,
} as const;

export const SeverityLevels = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const,
} as const;

export const AlertStatuses = {
  ACTIVE: 'active' as const,
  RESOLVED: 'resolved' as const,
  DISMISSED: 'dismissed' as const,
} as const;

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 🔗 RELATION
  @Index()
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, (farm) => farm.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  // 📌 CORE CLASSIFICATION
  @Index()
  @Column({
    type: 'enum',
    enum: ['disease', 'weather', 'system', 'advisory'],
    default: 'disease',
  })
  alertType!: AlertType;

  @Index()
  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  })
  severity!: SeverityLevel;

  @Index()
  @Column({
    type: 'enum',
    enum: ['active', 'resolved', 'dismissed'],
    default: 'active',
  })
  status!: AlertStatus;

  // 🧠 CONTENT
  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  // 🔍 SOURCE
  @Column({ type: 'varchar', nullable: true })
  source!: string | null;

  // 🧩 FLEXIBLE DATA
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  // 📍 TIMING
  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  triggeredAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  // 👁️ UX STATE
  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'boolean', default: false })
  isNotified!: boolean;

  // 🕒 AUDIT
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
