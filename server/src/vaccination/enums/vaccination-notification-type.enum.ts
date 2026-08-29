/**
 * Vaccination-domain notification categories. These are the `category`
 * values passed to NotificationService.send() / hasBeenNotified() — the
 * notification module itself doesn't know these exist, it just treats
 * category as an opaque string key for dedup and preference filtering.
 */
export enum VaccinationNotificationType {
  DUE = 'VACCINATION_DUE',
  MISSED = 'VACCINATION_MISSED',
}

/** The `reference.type` value used on every vaccination-originated notification. */
export const VACCINATION_SCHEDULE_REFERENCE_TYPE = 'vaccination_schedule';