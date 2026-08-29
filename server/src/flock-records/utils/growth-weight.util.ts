import { BadRequestException } from '@nestjs/common';
import { GrowthRecordDto } from '../dtos/growth-record.dto';

/**
 * Resolves either input mode down to the raw averageWeightKg the entity
 * stores. Returns null when the caller supplied neither weight field but
 * did supply the object (e.g. a PATCH that's only updating notes/sampleSize
 * on an existing record — see updateRecord in flock-records.service.ts for
 * how that's handled, since it can't blindly overwrite an existing weight
 * with null).
 *
 * Throws rather than guessing if both modes are supplied — same principle
 * as resolveEggCount: an ambiguous input shouldn't silently pick a winner
 * on a number that feeds straight into FCR calculations downstream.
 */
export function resolveAverageWeightKg(input?: GrowthRecordDto): number | null {
  if (!input) return null;

  const hasDirect = input.averageWeightKg !== undefined;
  const hasSampleMode = input.totalSampleWeightKg !== undefined;

  if (hasDirect && hasSampleMode) {
    throw new BadRequestException(
      'Provide averageWeightKg OR totalSampleWeightKg + sampleSize, not both',
    );
  }

  if (hasSampleMode) {
    if (!input.sampleSize || input.sampleSize < 1) {
      throw new BadRequestException(
        'sampleSize is required and must be at least 1 when providing totalSampleWeightKg',
      );
    }
    return parseFloat(
      (input.totalSampleWeightKg! / input.sampleSize).toFixed(3),
    );
  }

  if (hasDirect) {
    return input.averageWeightKg!;
  }

  return null;
}
