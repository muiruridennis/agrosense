import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { User } from '../../users/entities/user.entity';
import { FarmMemberRole } from './farm-member.entity';

export enum FarmInvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  DECLINED = 'declined',
}

@Entity('farm_invitations')
@Index(['farmId', 'targetPhoneNumber', 'status'])
@Index(['farmId', 'targetUserId', 'status'])
@Index(['tokenHash'])
export class FarmInvitation extends BaseEntity {
  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({ type: 'uuid' })
  invitedById!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invitedById' })
  invitedBy!: User;

  @Column({ type: 'varchar' })
  targetPhoneNumber!: string;

  @Column({ type: 'uuid', nullable: true })
  targetUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser!: User | null;

  @Column({
    type: 'enum',
    enum: FarmMemberRole,
    default: FarmMemberRole.WORKER,
  })
  role!: FarmMemberRole;

  @Column({ type: 'jsonb', nullable: true, default: null })
  assignedHouseIds!: string[] | null;

  @Column({
    type: 'enum',
    enum: FarmInvitationStatus,
    default: FarmInvitationStatus.PENDING,
  })
  status!: FarmInvitationStatus;

  @Column({ type: 'varchar', length: 255 })
  tokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'int', default: 0 })
  resendCount!: number;

  @Column({ type: 'int', default: 0 })
  failedAcceptanceAttempts!: number;
}
