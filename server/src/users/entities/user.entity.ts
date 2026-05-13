import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Farm } from '../../farms/entities/farm.entity';
import { FarmMember } from '../../farm-members/entities/farm-member.entity';

export enum UserRole {
  FARMER = 'farmer',
  AGRONOMIST = 'agronomist',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, nullable: true, type: 'varchar' })
  email!: string | null;

  @Index()
  @Column({ type: 'varchar', unique: true })
  phoneNumber!: string;

  @Column({ type: 'varchar' })
  fullName!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.FARMER })
  role!: UserRole;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified!: boolean;

  @Column({ type: 'varchar', default: 'en', length: 10 })
  preferredLanguage!: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  password!: string | null;

  @Column({ type: 'varchar', nullable: true })
  currentHashedRefreshToken!: string | null;

  @OneToMany(() => Farm, (farm) => farm.owner)
  farms!: Farm[];

  @OneToMany(() => FarmMember, (member) => member.user)
farmMembers!: FarmMember[];
 
}
