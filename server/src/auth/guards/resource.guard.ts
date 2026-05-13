// auth/guards/resource.guard.ts
import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FarmMembersService } from '../../farm-members/farm-members.service';

export const RESOURCE_OWNER_KEY = 'resourceOwner';
export const ResourceOwner = (resourceType: string, idParam: string = 'id') => 
  SetMetadata(RESOURCE_OWNER_KEY, { resourceType, idParam });

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly farmMembersService: FarmMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(RESOURCE_OWNER_KEY, context.getHandler());
    
    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params[metadata.idParam];

    if (!user || !resourceId) {
      return false;
    }

    // Get farmId from the resource
    const farmId = await this.getFarmIdFromResource(metadata.resourceType, resourceId);
    
    if (!farmId) {
      return false;
    }

    try {
      await this.farmMembersService.verifyAccess(user.id, farmId);
      return true;
    } catch {
      return false;
    }
  }

  private async getFarmIdFromResource(resourceType: string, resourceId: string): Promise<string | null> {
    // This needs to be implemented per resource type
    // Or use a registry pattern
    return null;
  }
}