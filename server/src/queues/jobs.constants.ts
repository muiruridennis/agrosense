export const NOTIFICATION_QUEUE = 'notification';

export const NOTIFICATION_JOBS = {
  DELIVER: 'deliver',
  DELIVER_SCHEDULED: 'deliver-scheduled',
  SEND_DIGEST: 'send-digest',
  CLEANUP: 'cleanup',
  ESCALATE: 'escalate',
  RETRY_FAILED: 'retry-failed',
} as const;
export const ACTIVATE_SCHEDULED_PRICING_JOB = 'activate-scheduled-pricing';
export const ADVISORY_QUEUE = 'advisory';
export const DAILY_ADVISORY_JOB = 'daily-advisory';
export const WEATHER_ADVISORIES_JOB = 'weather-advisories';
export const PRICING_QUEUE = 'pricing';
