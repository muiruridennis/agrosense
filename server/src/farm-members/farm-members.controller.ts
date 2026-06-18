// farm-members/farm-members.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  FarmMembersService,
  AddFarmMemberDto,
  UpdateFarmMemberDto,
  CreateFarmInvitationDto,
  AcceptFarmInvitationDto,
  ResendFarmInvitationDto,
  RevokeFarmInvitationDto,
} from './farm-members.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmRoleGuard, RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from './entities/farm-member.entity';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthenticationGuard)
@Controller('farms/:farmId/members')
export class FarmMembersController {
  constructor(private readonly membersService: FarmMembersService) {}

  @Post()
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  addMember(
    @Param('farmId') farmId: string,
    @Body() dto: AddFarmMemberDto,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.addMember(farmId, req.user.id, dto);
  }

  @Post('invitations')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  createInvitation(
    @Param('farmId') farmId: string,
    @Body() dto: CreateFarmInvitationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.createInvitation(farmId, req.user.id, dto);
  }

  @Get('invitations')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  getInvitations(@Param('farmId') farmId: string, @Req() req: RequestWithUser) {
    return this.membersService.getInvitations(farmId, req.user.id);
  }

  @Get('invitations/:invitationId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  getInvitation(
    @Param('farmId') farmId: string,
    @Param('invitationId') invitationId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.getInvitation(farmId, invitationId, req.user.id);
  }

  @Post('invitations/:invitationId/resend')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  resendInvitation(
    @Param('farmId') farmId: string,
    @Param('invitationId') invitationId: string,
    @Body() dto: ResendFarmInvitationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.resendInvitation(
      farmId,
      invitationId,
      req.user.id,
      dto,
    );
  }

  @Post('invitations/:invitationId/revoke')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  revokeInvitation(
    @Param('farmId') farmId: string,
    @Param('invitationId') invitationId: string,
    @Body() dto: RevokeFarmInvitationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.revokeInvitation(
      farmId,
      invitationId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  getMembers(@Param('farmId') farmId: string, @Req() req: RequestWithUser) {
    return this.membersService.getMembers(farmId, req.user.id);
  }

  @Get('summary')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  getMemberSummary(@Param('farmId') farmId: string) {
    return this.membersService.getMemberSummary(farmId);
  }

  @Get(':memberId')
  getMember(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    return this.membersService.getMember(memberId, req.user.id);
  }

  @Patch(':memberId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  updateMember(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateFarmMemberDto,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.updateMember(memberId, req.user.id, dto);
  }

  @Delete(':memberId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  removeMember(
    @Param('memberId') memberId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.removeMember(memberId, req.user.id);
  }

  @Post('transfer-ownership')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  transferOwnership(
    @Param('farmId') farmId: string,
    @Body('phoneNumber') phoneNumber: string,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.transferOwnership(
      farmId,
      req.user.id,
      phoneNumber,
    );
  }
}

@Controller('farm-invitations')
export class FarmInvitationsController {
  constructor(private readonly membersService: FarmMembersService) {}

  @Post('accept')
  acceptInvitation(
    @Body() dto: AcceptFarmInvitationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.membersService.acceptInvitation(
      dto.token,
      dto.phoneNumber,
      dto,
      req.user?.id,
    );
  }
}

// User-scoped endpoints (no farm ID in URL)
@UseGuards(JwtAuthenticationGuard)
@Controller('users/me')
export class UserFarmController {
  constructor(private readonly membersService: FarmMembersService) {}

  @Get('farms')
  getUserFarms(@Req() req: RequestWithUser) {
    return this.membersService.findAccessibleFarms(req.user.id);
  }

  @Get('manager-farms')
  getUserManagerFarms(@Req() req: RequestWithUser) {
    return this.membersService.getUserManagerFarms(req.user.id);
  }
}
