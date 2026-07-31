import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('inapp_notifications')
@Index(['userId', 'createdAt'])
@Index(['userId', 'read'])
export class InAppNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  farmId: string | null;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text')
  body: string;

  @Column('jsonb', { nullable: true })
  data: Record<string, any> | null;

  @Column('varchar', { length: 255, nullable: true })
  referenceId: string | null;

  @Column('varchar', { length: 100, nullable: true })
  referenceType: string | null;

  @Column('boolean', { default: false })
  read: boolean;

  @Column('timestamptz', { nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}