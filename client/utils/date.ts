// app/utils/date.ts

import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from 'date-fns';
import { enGB } from 'date-fns/locale';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type DateInput = string | Date | null | undefined;

/**
 * Safely parse a date to a Date object
 * Returns null if invalid
 */
function safeParseDate(date: DateInput): Date | null {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? dateObj : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format date: "12 May 2026"
 */
export function formatDate(
  date: DateInput,
  options?: { includeYear?: boolean }
): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  
  const formatStr = options?.includeYear !== false ? 'dd MMM yyyy' : 'dd MMM';
  return format(dateObj, formatStr, { locale: enGB });
}

/**
 * Format date: "May 12, 2026"
 */
export function formatDateLong(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'MMMM dd, yyyy', { locale: enGB });
}

/**
 * Format date: "12/05/2026"
 */
export function formatDateShort(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'dd/MM/yyyy', { locale: enGB });
}

/**
 * Format date: "12 May"
 */
export function formatDateCompact(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'dd MMM', { locale: enGB });
}

/**
 * Format time: "14:30"
 */
export function formatTime(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'HH:mm', { locale: enGB });
}

/**
 * Format time with seconds: "14:30:00"
 */
export function formatTimeFull(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'HH:mm:ss', { locale: enGB });
}

/**
 * Format date and time: "12 May 2026, 14:30"
 */
export function formatDateTime(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'dd MMM yyyy, HH:mm', { locale: enGB });
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIVE TIME
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format relative time: "2 hours ago", "Just now"
 */
export function formatRelativeTime(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, dateObj);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  
  const diffHours = differenceInHours(now, dateObj);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = differenceInDays(now, dateObj);
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return formatDate(dateObj);
}

/**
 * Format as: "5 days ago"
 */
export function formatDistance(date: DateInput, baseDate?: Date): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true,
    locale: enGB,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE INPUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get date in YYYY-MM-DD format for date inputs
 */
export function getDateInputValue(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '';
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Get today's date in YYYY-MM-DD format for date inputs
 */
export function getTodayDateInput(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if date is today
 */
export function isToday(date: DateInput): boolean {
  const dateObj = safeParseDate(date);
  if (!dateObj) return false;
  return format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
}

/**
 * Check if date is in the past
 */
export function isPast(date: DateInput): boolean {
  const dateObj = safeParseDate(date);
  if (!dateObj) return false;
  return dateObj.getTime() < new Date().getTime();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: DateInput): boolean {
  const dateObj = safeParseDate(date);
  if (!dateObj) return false;
  return dateObj.getTime() > new Date().getTime();
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: DateInput, date2: DateInput): boolean {
  const d1 = safeParseDate(date1);
  const d2 = safeParseDate(date2);
  if (!d1 || !d2) return false;
  return format(d1, 'yyyy-MM-dd') === format(d2, 'yyyy-MM-dd');
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the number of days between two dates
 */
export function daysBetween(date1: DateInput, date2: DateInput): number {
  const d1 = safeParseDate(date1);
  const d2 = safeParseDate(date2);
  if (!d1 || !d2) return 0;
  return Math.abs(differenceInDays(d1, d2));
}

/**
 * Add days to a date
 */
export function addDays(date: DateInput, days: number): Date | null {
  const dateObj = safeParseDate(date);
  if (!dateObj) return null;
  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESET FORMATS FOR SPECIFIC USE CASES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format for table cells: "12 May 2026"
 */
export const formatTableDate = formatDate;

/**
 * Format for cards: "12 May"
 */
export const formatCardDate = formatDateCompact;

/**
 * Format for activity feed: "2 hours ago"
 */
export const formatActivityDate = formatRelativeTime;

/**
 * Format for charts: "May"
 */
export function formatChartDate(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'MMM', { locale: enGB });
}

/**
 * Format for filenames: "2026-05-12"
 */
export function formatFilenameDate(date: DateInput): string {
  const dateObj = safeParseDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'yyyy-MM-dd');
}