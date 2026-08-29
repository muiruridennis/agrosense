/** Ventilation design — affects heat stress risk and how much you depend on natural airflow */
export enum HouseType {
  OPEN_SIDED = 'open_sided',
  CLOSED = 'closed',
  SEMI_CLOSED = 'semi_closed',
}

/**
 * Floor/housing system — affects stocking density norms, litter management,
 * and cleaning protocol between flocks. A deep litter house and a battery
 * cage house are not interchangeable and shouldn't be modeled as if they were.
 */
export enum HousingSystem {
  DEEP_LITTER = 'deep_litter',
  BATTERY_CAGE = 'battery_cage',
  SLATTED_FLOOR = 'slatted_floor',
  FREE_RANGE = 'free_range',
}

/**
 * Operational state of the house itself — distinct from whether a flock is
 * profitable or healthy, which is Flock/FlockRecord territory.
 *
 * OCCUPIED and the rest-period clock (lastDepopulatedAt/minimumRestDays)
 * are set ONLY by FlockModule via markOccupied()/markVacated() — never
 * directly by a farmer through the API. MAINTENANCE and DECOMMISSIONED
 * are the two states a farmer can set manually, via updateStatus().
 */
export enum HouseStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
}

/** Standard biosecurity downtime between flocks if the farmer doesn't override it */
export const DEFAULT_MINIMUM_REST_DAYS = 14;