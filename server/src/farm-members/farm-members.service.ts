// farm-members/farm-members.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, QueryRunner } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { FarmsService } from '../farms/farms.service';
import { FarmMemberRole, FarmMember } from './entities/farm-member.entity';
import {
  FarmInvitation,
  FarmInvitationStatus,
} from './entities/farm-invitation.entity';

export class AddFarmMemberDto {
  phoneNumber!: string;
  role!: FarmMemberRole;
  assignedHouseIds?: string[];
}

export class UpdateFarmMemberDto {
  role?: FarmMemberRole;
  assignedHouseIds?: string[] | null;
  isActive?: boolean;
}

export class CreateFarmInvitationDto {
  phoneNumber!: string;
  role!: FarmMemberRole;
  assignedHouseIds?: string[];
  notes?: string;
}

export class AcceptFarmInvitationDto {
  token!: string;
  phoneNumber!: string;
  fullName?: string;
  password?: string;
}

export class ResendFarmInvitationDto {
  message?: string;
}

export class RevokeFarmInvitationDto {
  reason?: string;
}

@Injectable()
export class FarmMembersService {
  private readonly logger = new Logger(FarmMembersService.name);

  constructor(
    @InjectRepository(FarmMember)
    private readonly memberRepo: Repository<FarmMember>,
    @InjectRepository(FarmInvitation)
    private readonly invitationRepo: Repository<FarmInvitation>,
    private readonly farmsService: FarmsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Add a member to a farm.
   * Authorization: Controller uses @RequiredRoles(OWNER) guard
   *
   * Flow:
   * 1. Find or create user by phone number
   * 2. Check for duplicate membership
   * 3. Validate role-specific requirements
   * 4. Create farm member record
   * 5. Send invitation SMS (if new user)
   */
  async addMember(
    farmId: string,
    requestingUserId: string,
    dto: AddFarmMemberDto,
  ): Promise<FarmMember> {
    // Find or create user by phone number
    let user = await this.usersService.findByPhoneNumber(dto.phoneNumber);
    let isNewUser = false;

    if (!user) {
      user = await this.usersService.createFromPhone(dto.phoneNumber);
      isNewUser = true;
      this.logger.log(`Created new user account for ${dto.phoneNumber}`);
    }

    // Check for duplicate membership
    const existing = await this.memberRepo.findOne({
      where: { farmId, userId: user.id },
    });

    if (existing) {
      throw new ConflictException(
        `User ${dto.phoneNumber} is already a member of this farm`,
      );
    }

    // Validate role-specific requirements
    this.validateRoleRequirements(dto.role, dto.assignedHouseIds);

    // Create the farm member record
    const member = this.memberRepo.create({
      farmId,
      userId: user.id,
      role: dto.role,
      assignedHouseIds:
        dto.role === FarmMemberRole.WORKER ? dto.assignedHouseIds : null,
      joinedAt: new Date(),
      isActive: true,
      createdBy: requestingUserId,
    });

    const savedMember = await this.memberRepo.save(member);

    // TODO: Send SMS invitation for new users
    if (isNewUser) {
      await this.sendInvitationSMS(dto.phoneNumber, farmId);
    }

    this.logger.log(
      `User ${user.id} added as ${dto.role} to farm ${farmId} by ${requestingUserId}`,
    );

    return savedMember;
  }
  // farm-members/farm-members.service.ts

  /**
   * Add owner as a farm member (special case - no phone number needed)
   * Called automatically when a farm is created
   */
  // farm-members.service.ts
async addOwnerAsMember(
  farmId: string,
  ownerId: string,
  queryRunner: QueryRunner,   // ← receive it
): Promise<FarmMember> {
  const existing = await queryRunner.manager.findOne(FarmMember, {
    where: { farmId, userId: ownerId },
  });

  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.role = FarmMemberRole.OWNER;
      existing.updatedAt = new Date();
      return queryRunner.manager.save(existing);
    }
    return existing;
  }

  const member = queryRunner.manager.create(FarmMember, {
    farmId,
    userId: ownerId,
    role: FarmMemberRole.OWNER,
    assignedHouseIds: null,
    joinedAt: new Date(),
    isActive: true,
    createdBy: ownerId,
  });

  const savedMember = await queryRunner.manager.save(member);
  this.logger.log(`Owner ${ownerId} added as member to farm ${farmId}`);
  return savedMember;
}

  async createInvitation(
    farmId: string,
    inviterId: string,
    dto: CreateFarmInvitationDto,
  ): Promise<FarmInvitation> {
    const targetPhoneNumber = this.normalizePhoneNumber(dto.phoneNumber);
    const farm = await this.farmsService.findOne(farmId, inviterId);
    console.log('Farm found for invitation:', farm);

    if (farm.ownerId !== inviterId) {
      throw new ForbiddenException('Only farm owners may invite members');
    }

    this.validateRoleRequirements(dto.role, dto.assignedHouseIds);

    const existingPending = await this.invitationRepo.findOne({
      where: {
        farmId,
        targetPhoneNumber,
        status: FarmInvitationStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new ConflictException(
        `An invitation is already pending for ${targetPhoneNumber}`,
      );
    }

    const targetUser =
      await this.usersService.findByPhoneNumber(targetPhoneNumber);

    if (targetUser) {
      const existingMember = await this.memberRepo.findOne({
        where: { farmId, userId: targetUser.id, isActive: true },
      });

      if (existingMember) {
        throw new ConflictException(
          `User ${targetPhoneNumber} is already an active member of this farm`,
        );
      }
    }

    const token = this.generateInvitationToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const invitation = this.invitationRepo.create({
      farmId,
      invitedById: inviterId,
      targetPhoneNumber,
      targetUserId: targetUser?.id ?? null,
      role: dto.role,
      assignedHouseIds:
        dto.role === FarmMemberRole.WORKER ? dto.assignedHouseIds : null,
      status: FarmInvitationStatus.PENDING,
      tokenHash,
      expiresAt,
      sentAt: null,
      acceptedAt: null,
      revokedAt: null,
      notes: dto.notes ?? null,
      resendCount: 0,
      failedAcceptanceAttempts: 0,
    });

    const savedInvitation = await this.invitationRepo.save(invitation);

    await this.sendInvitationSMS(targetPhoneNumber, farmId, token);
    savedInvitation.sentAt = new Date();
    await this.invitationRepo.save(savedInvitation);

    this.logger.log(
      `Invitation ${savedInvitation.id} created for ${targetPhoneNumber} on farm ${farmId} by ${inviterId}`,
    );

    return savedInvitation;
  }

  async getInvitations(
    farmId: string,
    requestingUserId: string,
  ): Promise<FarmInvitation[]> {
    const farm = await this.farmsService.findOne(farmId, requestingUserId);
    if (farm.ownerId !== requestingUserId) {
      throw new ForbiddenException('Only farm owners may view invitations');
    }

    return this.invitationRepo.find({
      where: { farmId },
      order: { createdAt: 'DESC' },
    });
  }

  async getInvitation(
    farmId: string,
    invitationId: string,
    requestingUserId: string,
  ): Promise<FarmInvitation> {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, farmId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const farm = await this.farmsService.findOne(farmId, requestingUserId);
    if (farm.ownerId !== requestingUserId) {
      throw new ForbiddenException('Only farm owners may view invitations');
    }

    return invitation;
  }

  async acceptInvitation(
    token: string,
    phoneNumber: string,
    dto: AcceptFarmInvitationDto,
    currentUserId?: string,
  ): Promise<FarmMember> {
    const targetPhoneNumber = this.normalizePhoneNumber(phoneNumber);
    const tokenHash = this.hashToken(token);

    const invitation = await this.invitationRepo.findOne({
      where: {
        targetPhoneNumber,
        status: FarmInvitationStatus.PENDING,
        tokenHash,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid');
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      invitation.status = FarmInvitationStatus.EXPIRED;
      await this.invitationRepo.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    let user: User;
    if (invitation.targetUserId) {
      if (currentUserId && currentUserId !== invitation.targetUserId) {
        throw new ForbiddenException(
          'Authenticated user does not match invited account',
        );
      }
      user = await this.usersService.getById(invitation.targetUserId);
    } else if (currentUserId) {
      user = await this.usersService.getById(currentUserId);
      if (user.phoneNumber !== targetPhoneNumber) {
        throw new ForbiddenException(
          'Authenticated user phone does not match invitation phone',
        );
      }
    } else {
      user = await this.usersService.createFromPhone(
        targetPhoneNumber,
        dto.fullName,
      );
    }

    const existingMembership = await this.memberRepo.findOne({
      where: { farmId: invitation.farmId, userId: user.id, isActive: true },
    });

    if (existingMembership) {
      throw new ConflictException('User already belongs to this farm');
    }

    const member = this.memberRepo.create({
      farmId: invitation.farmId,
      userId: user.id,
      role: invitation.role,
      assignedHouseIds: invitation.assignedHouseIds,
      joinedAt: new Date(),
      isActive: true,
      createdBy: invitation.invitedById,
    });

    const savedMember = await this.memberRepo.save(member);

    invitation.status = FarmInvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    await this.invitationRepo.save(invitation);

    if (!user.isPhoneVerified) {
      await this.usersService.markPhoneVerified(user.id);
    }

    this.logger.log(
      `Invitation ${invitation.id} accepted by ${user.id}; membership created ${savedMember.id}`,
    );

    return savedMember;
  }

  async resendInvitation(
    farmId: string,
    invitationId: string,
    requesterId: string,
    dto: ResendFarmInvitationDto,
  ): Promise<FarmInvitation> {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, farmId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== FarmInvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    const farm = await this.farmsService.findOne(farmId, requesterId);
    if (farm.ownerId !== requesterId) {
      throw new ForbiddenException(
        'Only the farm owner may resend invitations',
      );
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      invitation.status = FarmInvitationStatus.EXPIRED;
      await this.invitationRepo.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.resendCount >= 3) {
      throw new BadRequestException('Invitation resend limit exceeded');
    }

    const token = this.generateInvitationToken();
    invitation.tokenHash = this.hashToken(token);
    invitation.resendCount += 1;
    invitation.sentAt = new Date();
    await this.invitationRepo.save(invitation);

    await this.sendInvitationSMS(
      invitation.targetPhoneNumber,
      farmId,
      token,
      dto.message,
      true,
    );

    this.logger.log(`Invitation ${invitation.id} resent by ${requesterId}`);

    return invitation;
  }

  async revokeInvitation(
    farmId: string,
    invitationId: string,
    requesterId: string,
    dto: RevokeFarmInvitationDto,
  ): Promise<FarmInvitation> {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, farmId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== FarmInvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    const farm = await this.farmsService.findOne(farmId, requesterId);
    if (farm.ownerId !== requesterId) {
      throw new ForbiddenException(
        'Only the farm owner may revoke invitations',
      );
    }

    invitation.status = FarmInvitationStatus.REVOKED;
    invitation.revokedAt = new Date();
    invitation.notes = dto.reason ?? invitation.notes;

    const saved = await this.invitationRepo.save(invitation);
    this.logger.log(`Invitation ${invitation.id} revoked by ${requesterId}`);
    return saved;
  }

  async expireInvitations(): Promise<void> {
    const now = new Date();
    const expired = await this.invitationRepo.find({
      where: {
        status: FarmInvitationStatus.PENDING,
        expiresAt: LessThanOrEqual(now),
      },
    });

    for (const invitation of expired) {
      invitation.status = FarmInvitationStatus.EXPIRED;
      await this.invitationRepo.save(invitation);
      this.logger.log(`Invitation ${invitation.id} expired`);
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    const parsed = parsePhoneNumberFromString(phoneNumber);
    if (!parsed || !parsed.isValid()) {
      throw new BadRequestException('Invalid phone number');
    }

    return parsed.number;
  }

  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendInvitationSMS(
    phoneNumber: string,
    farmId: string,
    token?: string,
    message?: string,
    isResend = false,
  ): Promise<void> {
    const inviteMessage =
      message ||
      `You have been invited to join a farm on Agrosense.${token ? ` Use this code to accept: ${token}` : ''}`;

    this.logger.log(
      `${isResend ? 'Resend' : 'Send'} SMS to ${phoneNumber}: ${inviteMessage}`,
    );
    // TODO: replace with real SMS provider integration.
  }

  /**
   * Get all active members of a farm.
   * Authorization: Controller uses @RequiredRoles(OWNER) guard
   */
  async getMembers(
    farmId: string,
    requestingUserId: string,
  ): Promise<FarmMember[]> {
    this.logger.debug(
      `Owner ${requestingUserId} viewed members of farm ${farmId}`,
    );

    return this.memberRepo.find({
      where: { farmId, isActive: true },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
    });
  }

  /**
   * Get a specific member by ID.
   * Authorization: Owner OR the member themselves can view
   */
  async getMember(
    memberId: string,
    requestingUserId: string,
  ): Promise<FarmMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['user', 'farm'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check permission: owner of the farm OR the member themselves
    const isOwner = member.farm.ownerId === requestingUserId;
    const isSelf = member.userId === requestingUserId;

    if (!isOwner && !isSelf) {
      throw new ForbiddenException(
        'You do not have permission to view this member',
      );
    }

    return member;
  }

  /**
   * Update a member's role or permissions.
   * Authorization: Controller uses @RequiredRoles(OWNER) guard
   */
  async updateMember(
    memberId: string,
    requestingUserId: string,
    dto: UpdateFarmMemberDto,
  ): Promise<FarmMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['farm'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing yourself as owner
    if (
      member.userId === requestingUserId &&
      dto.role &&
      dto.role !== FarmMemberRole.OWNER
    ) {
      throw new BadRequestException('Cannot remove yourself as farm owner');
    }

    // Validate role-specific requirements for the new role
    const newRole = dto.role || member.role;
    const newHouseIds =
      dto.assignedHouseIds !== undefined
        ? dto.assignedHouseIds
        : member.assignedHouseIds;
    this.validateRoleRequirements(newRole, newHouseIds || undefined);

    // Managers cannot have assigned houses
    if (newRole === FarmMemberRole.MANAGER) {
      dto.assignedHouseIds = null;
    }

    // Apply updates
    Object.assign(member, {
      ...dto,
      updatedBy: requestingUserId,
      updatedAt: new Date(),
    });

    const savedMember = await this.memberRepo.save(member);

    this.logger.log(`Member ${memberId} updated by ${requestingUserId}`);

    return savedMember;
  }

  /**
   * Remove a member from a farm (soft delete).
   * Authorization: Controller uses @RequiredRoles(OWNER) guard
   */
  async removeMember(
    memberId: string,
    requestingUserId: string,
  ): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['farm'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing yourself
    if (member.userId === requestingUserId) {
      throw new BadRequestException('Cannot remove yourself from the farm');
    }

    member.isActive = false;
    member.updatedBy = requestingUserId;
    member.updatedAt = new Date();
    member.removedAt = new Date();

    await this.memberRepo.save(member);

    this.logger.log(
      `Member ${memberId} removed from farm by ${requestingUserId}`,
    );
  }

  /**
   * Verify access for a user to a specific farm.
   * Used by FarmAccessGuard and FarmRoleGuard.
   * Returns the member record if authorized, throws ForbiddenException otherwise.
   */
  async verifyAccess(
    userId: string,
    farmId: string,
    requiredRole?: FarmMemberRole | FarmMemberRole[],
  ): Promise<FarmMember> {
    const member = await this.memberRepo.findOne({
      where: { userId, farmId, isActive: true },
      relations: ['farm'],
    });

    if (!member) {
      this.logger.warn(
        `Access denied: User ${userId} not a member of farm ${farmId}`,
      );
      throw new ForbiddenException(`Access denied to farm ${farmId}`);
    }

    // Farm owner can do ANYTHING (overrides any role checks)
    if (member.farm.ownerId === userId) {
      return member;
    }

    // Check required role if specified
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];
      if (!allowedRoles.includes(member.role)) {
        throw new ForbiddenException(
          `This action requires ${allowedRoles.join(' or ')} role. Your role: ${member.role}`,
        );
      }
    }

    return member;
  }

  /**
   * Get all farms a user belongs to (active memberships only).
   */
  async getUserFarms(userId: string): Promise<(FarmMember & { farm: any })[]> {
    return this.memberRepo.find({
      where: { userId, isActive: true },
      relations: ['farm'],
      order: { joinedAt: 'DESC' },
    });
  }

  /**
   * Get farms where user is a manager or owner.
   * Used for manager dashboard and reporting access.
   */
  async getUserManagerFarms(userId: string): Promise<any[]> {
    const members = await this.memberRepo.find({
      where: {
        userId,
        isActive: true,
        role: FarmMemberRole.MANAGER,
      },
      relations: ['farm'],
    });

    // Also add farms where user is owner
    const ownedFarms = await this.farmsService.findAllByOwner(userId);

    // Combine and deduplicate by farm ID
    const farmMap = new Map();

    members.forEach((member) => {
      farmMap.set(member.farm.id, member.farm);
    });

    ownedFarms.forEach((farm) => {
      farmMap.set(farm.id, farm);
    });

    return Array.from(farmMap.values());
  }

  /**
   * Get all accessible farms for a user (owner, manager, or worker).
   * Returns farms with role information attached for dashboard context.
   *
   * This is the primary method for retrieving the current user's farm access,
   * centralizing membership-based farm access logic.
   *
   * Flow: authenticated user → active memberships → associated farms → role/context
   *
   * @param userId - The authenticated user's ID
   * @returns Array of farms with role information, ordered by join date (newest first)
   */
  async findAccessibleFarms(userId: string): Promise<any[]> {
    const memberships = await this.memberRepo.find({
      where: { userId, isActive: true },
      relations: ['farm'],
      order: { joinedAt: 'DESC' },
    });
  
    return memberships
  }

  /**
   * Check if a user has a specific role at a farm (without throwing).
   * Returns boolean - useful for conditional logic.
   */
  async hasRole(
    userId: string,
    farmId: string,
    role: FarmMemberRole | FarmMemberRole[],
  ): Promise<boolean> {
    try {
      await this.verifyAccess(userId, farmId, role);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get member by user ID and farm ID (if exists).
   * Returns null if not found (no exception).
   */
  async findMember(userId: string, farmId: string): Promise<FarmMember | null> {
    return this.memberRepo.findOne({
      where: { userId, farmId, isActive: true },
      relations: ['user', 'farm'],
    });
  }

  /**
   * Get all workers assigned to a specific house.
   * Used for worker assignment validation.
   */
  async getWorkersByHouse(
    farmId: string,
    houseId: string,
  ): Promise<FarmMember[]> {
    const members = await this.memberRepo.find({
      where: { farmId, role: FarmMemberRole.WORKER, isActive: true },
      relations: ['user'],
    });

    return members.filter((member) =>
      member.assignedHouseIds?.includes(houseId),
    );
  }

  /**
   * Get workers assigned to multiple houses (bulk query).
   */
  async getWorkersByHouses(
    farmId: string,
    houseIds: string[],
  ): Promise<Map<string, FarmMember[]>> {
    const members = await this.memberRepo.find({
      where: { farmId, role: FarmMemberRole.WORKER, isActive: true },
      relations: ['user'],
    });

    const result = new Map<string, FarmMember[]>();

    houseIds.forEach((houseId) => {
      result.set(
        houseId,
        members.filter((member) => member.assignedHouseIds?.includes(houseId)),
      );
    });

    return result;
  }

  /**
   * Get a summary of farm members by role.
   * Useful for dashboard stats.
   */
  async getMemberSummary(farmId: string): Promise<{
    total: number;
    byRole: Record<FarmMemberRole, number>;
    recentlyJoined: FarmMember[];
  }> {
    const members = await this.memberRepo.find({
      where: { farmId, isActive: true },
      relations: ['user'],
    });

    const byRole: Record<FarmMemberRole, number> = {
      [FarmMemberRole.OWNER]: 0,
      [FarmMemberRole.MANAGER]: 0,
      [FarmMemberRole.WORKER]: 0,
    };

    members.forEach((member) => {
      byRole[member.role]++;
    });

    // Get 5 most recent members
    const recentlyJoined = [...members]
      .sort(
        (a, b) => (b.joinedAt?.getTime() ?? 0) - (a.joinedAt?.getTime() ?? 0),
      )
      .slice(0, 5);

    return {
      total: members.length,
      byRole,
      recentlyJoined,
    };
  }

  /**
   * Transfer farm ownership to another user.
   * Special operation: Changes the farm owner and updates member roles.
   */
  async transferOwnership(
    farmId: string,
    currentOwnerId: string,
    newOwnerPhoneNumber: string,
  ): Promise<{ farm: any; newOwner: FarmMember; oldOwner: FarmMember }> {
    // Verify current owner is requesting
    const farm = await this.farmsService.findOne(farmId, currentOwnerId);
    if (farm.ownerId !== currentOwnerId) {
      throw new ForbiddenException(
        'Only the current farm owner can transfer ownership',
      );
    }

    // Find or create the new owner
    let newOwnerUser =
      await this.usersService.findByPhoneNumber(newOwnerPhoneNumber);
    let isNewUser = false;

    if (!newOwnerUser) {
      newOwnerUser =
        await this.usersService.createFromPhone(newOwnerPhoneNumber);
      isNewUser = true;
    }

    // Find or create the new owner's membership
    let newOwnerMember = await this.memberRepo.findOne({
      where: { farmId, userId: newOwnerUser.id },
    });

    if (!newOwnerMember) {
      newOwnerMember = this.memberRepo.create({
        farmId,
        userId: newOwnerUser.id,
        role: FarmMemberRole.OWNER,
        joinedAt: new Date(),
        isActive: true,
        createdBy: currentOwnerId,
      });
    } else {
      newOwnerMember.role = FarmMemberRole.OWNER;
      newOwnerMember.updatedBy = currentOwnerId;
      newOwnerMember.updatedAt = new Date();
    }

    // Update current owner to manager
    const currentOwnerMember = await this.memberRepo.findOne({
      where: { farmId, userId: currentOwnerId },
    });

    if (currentOwnerMember) {
      currentOwnerMember.role = FarmMemberRole.MANAGER;
      currentOwnerMember.updatedBy = currentOwnerId;
      currentOwnerMember.updatedAt = new Date();
      await this.memberRepo.save(currentOwnerMember);
    }

    // Update farm owner
    const updatedFarm = await this.farmsService.transferOwnership(
      farmId,
      currentOwnerId,
      newOwnerUser.id,
    );

    // Save new owner member
    const savedNewOwner = await this.memberRepo.save(newOwnerMember);

    this.logger.log(
      `Farm ${farmId} ownership transferred from ${currentOwnerId} to ${newOwnerUser.id}`,
    );

    // TODO: Send notification SMS to new owner
    if (isNewUser) {
      await this.sendInvitationSMS(newOwnerPhoneNumber, farmId);
    }

    return {
      farm: updatedFarm,
      newOwner: savedNewOwner,
      oldOwner: currentOwnerMember!,
    };
  }

  /**
   * Get member count by role for multiple farms (batch query).
   * Useful for dashboard overview.
   */
  async getMemberCountsByFarm(
    farmIds: string[],
  ): Promise<Map<string, Record<FarmMemberRole, number>>> {
    const members = await this.memberRepo.find({
      where: { farmId: In(farmIds), isActive: true },
    });

    const result = new Map<string, Record<FarmMemberRole, number>>();

    farmIds.forEach((farmId) => {
      const farmMembers = members.filter((m) => m.farmId === farmId);
      const counts: Record<FarmMemberRole, number> = {
        [FarmMemberRole.OWNER]: 0,
        [FarmMemberRole.MANAGER]: 0,
        [FarmMemberRole.WORKER]: 0,
      };

      farmMembers.forEach((m) => {
        counts[m.role]++;
      });

      result.set(farmId, counts);
    });

    return result;
  }

  /**
   * Validate role-specific requirements.
   * Private helper method.
   */
  private validateRoleRequirements(
    role: FarmMemberRole,
    assignedHouseIds?: string[],
  ): void {
    if (role === FarmMemberRole.WORKER) {
      if (!assignedHouseIds || assignedHouseIds.length === 0) {
        throw new BadRequestException(
          'Workers must be assigned to at least one house/pen',
        );
      }
    }

    if (role === FarmMemberRole.MANAGER && assignedHouseIds?.length) {
      throw new BadRequestException(
        'Managers have access to all houses - do not assign specific houses',
      );
    }
  }
}
