export const SCHEDULER_CRON = {
  EVERY_MINUTE: '* * * * *',

  EVERY_5_MINUTES: '*/5 * * * *',

  EVERY_15_MINUTES: '*/15 * * * *',

  EVERY_HOUR: '0 * * * *',

  DAILY_6_AM: '0 6 * * *',

  DAILY_7_AM: '0 7 * * *',

  DAILY_MIDNIGHT: '0 0 * * *',
  DAILY_9_20_PM: '56 21 * * *', // ← 9:32 PM
} as const;
