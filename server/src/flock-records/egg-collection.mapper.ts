import { EggCollection } from './entities/egg-collection.entity';
import { EggCollectionResponseDto } from './dtos/egg-collection-response.dto';

/**
 * Formats the tray breakdown into the sentence farmers actually think in:
 * "328 eggs = 10 trays + 28 loose eggs". Handles the two edge cases that
 * make a generic template read awkwardly: zero loose eggs, and singular
 * tray/egg counts.
 */
function formatTrayBreakdown(
  totalEggs: number,
  fullTrays: number,
  looseEggs: number,
): string {
  const trayWord = fullTrays === 1 ? 'tray' : 'trays';

  if (looseEggs === 0) {
    return `${totalEggs} eggs = ${fullTrays} ${trayWord}`;
  }

  const eggWord = looseEggs === 1 ? 'egg' : 'eggs';
  return `${totalEggs} eggs = ${fullTrays} ${trayWord} + ${looseEggs} loose ${eggWord}`;
}

export function toEggCollectionResponse(
  collection: EggCollection,
): EggCollectionResponseDto {
  // Read the entity's own getters — don't recompute totalEggs/totalTrays by
  // hand here. EGGS_PER_TRAY has exactly one source of truth
  // (egg-collection.entity.ts); a mapper that hardcodes 30 again is the
  // same bug the constant was introduced to prevent.
  const totalEggs = collection.totalEggs;
  const fullTrays = collection.totalTrays;
  const looseEggs = collection.looseEggs;

  return {
    id: collection.id,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,

    flockRecordId: collection.flockRecordId,

    morningEggs: collection.morningEggs,
    afternoonEggs: collection.afternoonEggs,
    eveningEggs: collection.eveningEggs,

    totalEggs,

    trayBreakdown: {
      fullTrays,
      looseEggs,
      display: formatTrayBreakdown(totalEggs, fullTrays, looseEggs),
    },
  };
}
