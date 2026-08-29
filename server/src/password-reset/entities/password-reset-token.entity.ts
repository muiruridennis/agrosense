import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * SHA-256 hash of the raw token sent to the user.
   *
   * We never store the raw reset token.
   */
  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  /**
   * When this token expires.
   */
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  /**
   * Once used, the token can never be used again.
   */
  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;
}