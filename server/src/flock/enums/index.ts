export enum FlockType {
  LAYERS = 'layers',
  BROILERS = 'broilers',
  KIENYEJI = 'kienyeji',
  BREEDERS = 'breeders',
}

export enum FlockStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

export enum FlockStage {
  PLACED = 'placed',
  BROODING = 'brooding',
  GROWING = 'growing',
  LAYING_PEAK = 'laying_peak',
  LAYING_DECLINE = 'laying_decline',
  HARVEST_READY = 'harvest_ready',
  DEPLETED = 'depleted',
  CLOSED = 'closed',
}

/**
 * What a flock is legally allowed to have recorded against it — separate
 * from FlockType, which just says what kind of flock it is. FlockType
 * answers "what is this flock"; FlockCapability answers "what can be
 * recorded/calculated for it."
 *
 * FEED_EFFICIENCY and REPRODUCTIVE_TRACKING are reserved but NOT yet wired
 * to any validation or entity — don't assume they're enforced anywhere
 * just because they're listed here.
 */
export enum FlockCapability {
  EGG_PRODUCTION = 'egg_production',
  GROWTH_TRACKING = 'growth_tracking',
  FEED_EFFICIENCY = 'feed_efficiency', // reserved, not yet implemented
  REPRODUCTIVE_TRACKING = 'reproductive_tracking', // reserved, not yet implemented
}

/**
 * Single source of truth for what each flock type can record. Adding a new
 * FlockType without an entry here is a compile error, not a 2am production
 * surprise.
 *
 * BREEDERS is intentionally [] — capabilities undefined until we know what
 * a breeder flock actually tracks day to day. This means a breeder flock
 * currently can't submit eggs OR weight; that's deliberate, not an oversight.
 */
export const FLOCK_CAPABILITIES: Record<FlockType, FlockCapability[]> = {
  [FlockType.LAYERS]: [
    FlockCapability.EGG_PRODUCTION,
    FlockCapability.GROWTH_TRACKING,
  ],
  [FlockType.BROILERS]: [FlockCapability.GROWTH_TRACKING],
  [FlockType.KIENYEJI]: [
    FlockCapability.EGG_PRODUCTION,
    FlockCapability.GROWTH_TRACKING,
  ],
  [FlockType.BREEDERS]: [],
};
