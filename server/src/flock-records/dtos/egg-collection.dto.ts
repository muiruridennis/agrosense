import { IsInt, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A farmer doesn't count eggs one at a time — trays fill up as birds lay,
 * and by collection time it's "4 trays and 7 loose," not "127 eggs."
 * Counting individually is the unrealistic path here, not the fallback.
 *
 * Supply EITHER `eggs` (a raw count — useful for API clients importing
 * historical data) OR `trays` (+ optional `looseEggs`) — never both.
 * See resolveEggCount() in egg-quantity.util.ts for how these get turned
 * into the single raw integer the entity actually stores.
 */
export class EggQuantityDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  eggs?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  trays?: number;

  /** Eggs short of a full tray — by definition never reaches 30 */
  @IsInt()
  @Min(0)
  @Max(29)
  @IsOptional()
  looseEggs?: number;
}

export class EggCollectionDto {
  @ValidateNested()
  @Type(() => EggQuantityDto)
  @IsOptional()
  morning?: EggQuantityDto;

  @ValidateNested()
  @Type(() => EggQuantityDto)
  @IsOptional()
  afternoon?: EggQuantityDto;

  @ValidateNested()
  @Type(() => EggQuantityDto)
  @IsOptional()
  evening?: EggQuantityDto;
}