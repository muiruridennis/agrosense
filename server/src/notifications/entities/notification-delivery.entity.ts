import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Notification } from './notification.entity';
import { BaseEntity } from '../../common/entities/base.entity';

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PUSH = 'push',
}

export enum DeliveryStatus {
  SENDING = 'sending',
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  CANCELLED = 'cancelled',
}

@Entity('notification_deliveries')
@Index(['notificationId', 'channel'], { unique: true })
@Index(['status', 'createdAt'])
@Index(['channel', 'status'])
export class NotificationDelivery extends BaseEntity {
 

  @Column('uuid')
  notificationId: string;

  @ManyToOne(() => Notification, (notification) => notification.deliveries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  // ── Delivery Info ──

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column('varchar', { length: 255, nullable: true })
  providerMessageId: string | null;

  @Column('text', { nullable: true })
  recipient: string | null;

  // ── Content Snapshot ──

  @Column('jsonb', { nullable: true })
  content: {
    subject?: string;
    body?: string;
    html?: string;
  } | null;

  // ── Timeline ──

  @Column('timestamptz', { nullable: true })
  queuedAt: Date | null;

  @Column('timestamptz', { nullable: true })
  sentAt: Date | null;

  @Column('timestamptz', { nullable: true })
  deliveredAt: Date | null;

  @Column('timestamptz', { nullable: true })
  failedAt: Date | null;

  @Column('timestamptz', { nullable: true })
  openedAt: Date | null;

  @Column('timestamptz', { nullable: true })
  clickedAt: Date | null;

  // ── Retry Logic ──

  @Column('integer', { default: 0 })
  retryCount: number;

  @Column('timestamptz', { nullable: true })
  nextRetryAt: Date | null;

  @Column('text', { nullable: true })
  error: string | null;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;
}