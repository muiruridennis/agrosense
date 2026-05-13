import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Farm } from '../../farms/entities/farm.entity';

export enum FarmMemberRole {
  OWNER = 'owner', // full access, owns the farm
  MANAGER = 'manager', // can review records, manage staff, see all data
  WORKER = 'worker', // can only submit daily records
}

/**
 * FarmMember — a user's role on a specific farm.
 * Allows same user to be owner on one farm, manager on another, worker on a third.
 */
@Entity('farm_members')
@Unique(['userId', 'farmId'])
@Index('idx_farm_members_farm', ['farmId'])
@Index('idx_farm_members_user', ['userId'])
export class FarmMember extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  farmId!: string;

  @ManyToOne(() => Farm, (farm) => farm.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm;

  @Column({
    type: 'enum',
    enum: FarmMemberRole,
    default: FarmMemberRole.WORKER,
  })
  role!: FarmMemberRole;

  /**
   * For workers: which houses are they assigned to?
   * Stored as a JSON array of house IDs. Workers can only submit records for assigned houses.
   * For managers/owners: null (they can access all houses).
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    default: null,
  })
  assignedHouseIds!: string[] | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  joinedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  removedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
