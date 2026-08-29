import { FlockRecord } from './entities/flock-record.entity';
import { EggCollectionResponseDto } from './dtos/egg-collection-response.dto';
import { toEggCollectionResponse } from './egg-collection.mapper';

export type FlockRecordResponse = Omit<FlockRecord, 'eggCollection'> & {
  eggCollection: EggCollectionResponseDto | null;
};

/**
 * The controller is the boundary that owns response shape — the service
 * keeps returning plain entities so its transactional logic stays
 * untangled from presentation concerns. This is the one place that swaps
 * the raw eggCollection relation for its human-friendly form before
 * anything leaves the API.
 */
export function toFlockRecordResponse(
  record: FlockRecord,
): FlockRecordResponse {
  return {
    ...record,
    eggCollection: record.eggCollection
      ? toEggCollectionResponse(record.eggCollection)
      : null,
  };
}
