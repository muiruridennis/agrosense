import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { NotificationDelivery } from './notification-delivery.entity';
import { User } from '../../users/entities/user.entity';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../enums';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['farmId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Notification extends BaseEntity {
  @Column('uuid', { nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.notifications, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column('uuid', { nullable: true })
  farmId: string | null;

  @Column('varchar', { length: 50, nullable: true })
  role: string | null;

  // ── Content ──

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text')
  body: string;

  @Column('jsonb', { nullable: true })
  data: Record<string, any> | null;

  // ── Delivery ──

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
  })
  channels: NotificationChannel[];

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column('varchar', { length: 100, nullable: true })
  category: string | null;

  @Column('varchar', { length: 255, nullable: true })
  referenceId: string | null;

  // ── Scheduling ──

  @Column('timestamptz', { nullable: true })
  scheduledFor: Date | null;

  @Column('timestamptz', { nullable: true })
  deliveredAt: Date | null;

  @Column('timestamptz', { nullable: true })
  readAt: Date | null;
  // ── Relationships ──

  @OneToMany(() => NotificationDelivery, (delivery) => delivery.notification)
  deliveries: NotificationDelivery[];
}
