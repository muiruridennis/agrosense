import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFeatureFlagDto } from './create-feature-flag.dto';

// key is intentionally excluded — it's the identifier code checks against
// (isEnabled('channel.push')), so it's create-only. Renaming it here would
// silently orphan every call site that still checks the old key.
export class UpdateFeatureFlagDto extends PartialType(
  OmitType(CreateFeatureFlagDto, ['key'] as const),
) {}