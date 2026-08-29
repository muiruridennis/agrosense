// email/entities/email-attachment.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EmailLog } from './email-log.entity';

@Entity('email_attachments')
@Index(['emailLogId'])                    // For finding attachments by email
@Index(['status'])                        // For filtering by upload status
export class EmailAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── File Information ──

  @Column('varchar', { length: 255 })
  filename: string;

  @Column('varchar', { length: 100, nullable: true })
  contentType: string | null;

  @Column('integer', { default: 0 })
  size: number;

  // ── Storage ──

  @Column('varchar', { length: 255, nullable: true })
  storageKey: string | null; // For S3/Cloud storage reference

  @Column('varchar', { length: 500, nullable: true })
  storageUrl: string | null; // Public URL if accessible

  @Column('varchar', { length: 255, nullable: true })
  cid: string | null; // Content-ID for inline images

  // ── Status ──

  @Column({
    type: 'enum',
    enum: ['pending', 'uploaded', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'uploaded' | 'failed';

  @Column('text', { nullable: true })
  error: string | null;

  // ── Timestamps ──

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // ── Relationships ──

  @ManyToOne(() => EmailLog, (emailLog) => emailLog.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emailLogId' })
  emailLog: EmailLog;

  @Column('uuid')
  emailLogId: string;
}