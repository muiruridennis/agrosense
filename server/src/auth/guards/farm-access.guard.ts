import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FarmMembersService } from '../../farm-members/farm-members.service';

@Injectable()
export class FarmAccessGuard implements CanActivate {
  constructor(private readonly farmMembersService: FarmMembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const farmId = request.params.farmId || request.body.farmId;

    if (!user || !farmId) {
      return false;
    }

    try {
      await this.farmMembersService.verifyAccess(user.id, farmId);
      return true;
    } catch {
      return false;
    }
  }
}
