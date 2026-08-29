import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('notification_templates')
@Index(['type', 'isActive'])
@Index(['category'])
export class NotificationTemplate extends BaseEntity {
  @Column('varchar', { length: 100, unique: true })
  type: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 500, nullable: true })
  description: string | null;

  @Column('varchar', { length: 100 })
  category: string;

  @Column('varchar', { length: 255 })
  subject: string;

  @Column('text')
  body: string;

  @Column('text', { nullable: true })
  html: string | null;

  @Column('jsonb', { default: {} })
  variables: {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }[];

  @Column('jsonb', { default: {} })
  channelConfig: {
    sms?: { body: string };
    whatsapp?: { body: string };
    push?: { title: string; body: string };
  };

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: ['system', 'custom'],
    default: 'system',
  })
  templateType: 'system' | 'custom';

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;
  @Column('uuid', { nullable: true })
  createdBy: string | null;

  @Column('uuid', { nullable: true })
  updatedBy: string | null;
}
