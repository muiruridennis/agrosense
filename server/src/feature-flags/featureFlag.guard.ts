import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';

function FeatureFlagGuard(featureFlagKey: string): Type<CanActivate> {
  @Injectable()
  class Guard implements CanActivate {
    constructor(
      private readonly featureFlagsService: FeatureFlagsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const enabled = await this.featureFlagsService.isEnabled(featureFlagKey);

      if (!enabled) {
        const request = context.switchToHttp().getRequest();

        throw new NotFoundException(
          `Cannot ${request.method} ${request.url}`,
        );
      }

      return true;
    }
  }

  return mixin(Guard);
}

export default FeatureFlagGuard;