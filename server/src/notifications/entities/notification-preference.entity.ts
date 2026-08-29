import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum Frequency {
  INSTANT = 'instant',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

@Entity('notification_preferences')
@Index(['userId', 'farmId'], { unique: true })
@Index(['userId'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  farmId: string | null;

  @Column('varchar', { length: 50, nullable: true })
  role: string | null;

  @Column('jsonb', { default: {} })
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
  };

  @Column('jsonb', { default: {} })
  categories: Record<
    string,
    {
      enabled: boolean;
      priority: 'low' | 'medium' | 'high' | 'critical';
      frequency: Frequency;
    }
  >;

  @Column('jsonb', { nullable: true })
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    days: string[];
    overrideForCritical: boolean;
  } | null;

  @Column({
    type: 'enum',
    enum: Frequency,
    default: Frequency.INSTANT,
  })
  defaultFrequency: Frequency;

  @Column('jsonb', { default: {} })
  digestPreferences: {
    dailyTime: string;
    weeklyDay: string;
    weeklyTime: string;
    includeCategories: string[];
  };

  @Column('jsonb', { nullable: true })
  escalationRules: {
    enabled: boolean;
    afterMinutes: number;
    escalateTo: ('owner' | 'manager' | 'all' | 'custom')[];
    customUserIds?: string[];
  } | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}