import { BadRequestException } from '@nestjs/common';
import { EggQuantityDto } from '../dtos/egg-collection.dto';
import { EGGS_PER_TRAY } from '../entities/egg-collection.entity';

/**
 * Resolves a single collection session (morning/afternoon/evening) down to
 * the raw egg count the entity stores. Throws rather than guessing if both
 * representations are supplied — silently preferring one would risk under-
 * or over-counting production without anyone noticing, and this number
 * feeds straight into eggRevenue and productionRatePercent downstream.
 */
export function resolveEggCount(quantity?: EggQuantityDto): number {
  if (!quantity) return 0;

  const hasEggs = quantity.eggs !== undefined;
  const hasTrayMode =
    quantity.trays !== undefined || quantity.looseEggs !== undefined;

  if (hasEggs && hasTrayMode) {
    throw new BadRequestException(
      'Provide eggs OR trays + looseEggs for a collection session, not both',
    );
  }

  if (hasTrayMode) {
    return (quantity.trays ?? 0) * EGGS_PER_TRAY + (quantity.looseEggs ?? 0);
  }

  return quantity.eggs ?? 0;
}
