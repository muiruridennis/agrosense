// email/entities/email-log.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EmailAttachment } from './email-attachment.entity';

@Entity('email_logs')
@Index(['status', 'createdAt'])
@Index(['referenceId', 'referenceType'])
@Index(['to'])
@Index(['userId'])                        // For user-specific queries
@Index(['farmId'])                        // For farm-specific queries
@Index(['sentAt'])                        // For date range queries
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Recipients ──

  @Column('text', { array: true })
  to: string[];

  @Column('text', { array: true, nullable: true })
  cc: string[] | null;

  @Column('text', { array: true, nullable: true })
  bcc: string[] | null;

  // ── Email Content ──

  @Column('varchar', { length: 255 })
  subject: string;

  @Column('text', { nullable: true })
  body: string | null;

  @Column('text', { nullable: true })
  html: string | null;

  @Column('varchar', { length: 255, nullable: true })
  from: string | null;

  // ── Delivery Status ──

  @Column('varchar', { length: 255, nullable: true })
  messageId: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'failed', 'bounced', 'queued'],
    default: 'pending',
  })
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'queued';

  @Column('text', { nullable: true })
  error: string | null;

  // ── Retry Information ──

  @Column('integer', { default: 0 })
  retryCount: number;

  @Column('timestamptz', { nullable: true })
  lastRetryAt: Date | null;

  @Column('timestamptz', { nullable: true })
  nextRetryAt: Date | null;

  // ── Business Reference ──

  @Column('varchar', { length: 255, nullable: true })
  referenceId: string | null;

  @Column('varchar', { length: 255, nullable: true })
  referenceType: string | null;

  @Column('uuid', { nullable: true })
  userId: string | null;

  @Column('uuid', { nullable: true })
  farmId: string | null;

  // ── Metadata ──

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @Column('timestamptz', { nullable: true })
  sentAt: Date | null;

  @Column('timestamptz', { nullable: true })
  deliveredAt: Date | null;

  @Column('timestamptz', { nullable: true })
  openedAt: Date | null;

  @Column('timestamptz', { nullable: true })
  clickedAt: Date | null;

  // ── Timestamps ──

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // ── Relationships ──

  @OneToMany(() => EmailAttachment, (attachment) => attachment.emailLog, {
    cascade: true,
    eager: false,
  })
  attachments: EmailAttachment[];
}
