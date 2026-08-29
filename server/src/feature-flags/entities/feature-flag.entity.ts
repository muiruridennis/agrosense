import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('feature_flags')
export class FeatureFlag extends BaseEntity {

  /**
   * Internal identifier code checks against.
   * Examples: 'channel.sms', 'channel.push', 'notifications.digest_enabled'
   */
  @Index({ unique: true })
  @Column({ length: 100 })
  key: string;

  /** Human readable name, for an admin dashboard */
  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: false })
  isEnabled: boolean;

  /**
   * Optional targeting: if set, the flag only applies to these farms/users
   * even when enabled is true. Leave both null for a plain global flag.
   */
  @Column('simple-array', { nullable: true })
  allowedFarmIds: string[] | null;

  @Column('simple-array', { nullable: true })
  allowedUserIds: string[] | null;
}
