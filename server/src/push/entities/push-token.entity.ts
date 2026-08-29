// push/entities/push-token.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('push_tokens')
@Index(['userId', 'deviceType'])
@Index(['token'], { unique: true })
export class PushToken extends BaseEntity {
  @Column('uuid')
  userId: string;

  @Column('varchar', { length: 500 })
  token: string;

  @Column({
    type: 'enum',
    enum: ['ios', 'android', 'web'],
  })
  deviceType: 'ios' | 'android' | 'web';

  @Column('varchar', { length: 255, nullable: true })
  deviceName: string | null;

  @Column('varchar', { length: 255, nullable: true })
  deviceModel: string | null;

  @Column('varchar', { length: 50, nullable: true })
  osVersion: string | null;

  @Column('varchar', { length: 50, nullable: true })
  appVersion: string | null;

  @Column('boolean', { default: true })
  active: boolean;

  @Column('timestamptz', { nullable: true })
  lastUsedAt: Date | null;
}
