import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FarmMembersService } from '../../farm-members/farm-members.service';
import { FarmMemberRole } from '../../farm-members/entities/farm-member.entity';

export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const RequiredRoles = (...roles: FarmMemberRole[]) => 
  SetMetadata(REQUIRED_ROLES_KEY, roles);

@Injectable()
export class FarmRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly farmMembersService: FarmMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<FarmMemberRole[]>(
      REQUIRED_ROLES_KEY,
      context.getHandler(),
    );

    // No roles required - allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const farmId = request.params.farmId || request.body.farmId;

    if (!user || !farmId) {
      return false;
    }

    try {
      await this.farmMembersService.verifyAccess(user.id, farmId, requiredRoles);
      return true;
    } catch {
      return false;
    }
  }
}