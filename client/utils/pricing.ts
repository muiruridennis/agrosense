// app/utils/pricing.ts
import { formatDate, formatDateTime } from "./date";

/**
 * Format a pricing creation reason to be human-readable
 */
export function formatCreationReason(reason: string | null): string {
  if (!reason) return '—';

  // Scheduled for: "Scheduled for 2026-07-15T00:00:00.000Z: Scheduled price increase for next quarter"
  const scheduledMatch = reason.match(/Scheduled for ([\d-]+T[\d:.]+Z): (.+)/);
  if (scheduledMatch) {
    const [, dateStr, message] = scheduledMatch;
    const formattedDate = formatDate(dateStr);
    return ` Scheduled for ${formattedDate}: ${message}`;
  }

  // Scheduled activation: "Scheduled activation: Effective from 2026-07-15T00:00:00.000Z: ..."
  const scheduledActivationMatch = reason.match(/Scheduled activation: Effective from ([\d-]+T[\d:.]+Z): (.+)/);
  if (scheduledActivationMatch) {
    const [, dateStr, message] = scheduledActivationMatch;
    const formattedDate = formatDate(dateStr);
    return `Activated (from ${formattedDate}): ${message}`;
  }

  // Auto-restored: "Auto-restored as fallback after suspension of v2: ..."
  const restoreMatch = reason.match(/Auto-restored as fallback after suspension of v(\d+): (.+)/);
  if (restoreMatch) {
    const [, version, message] = restoreMatch;
    return `↩️ Auto-restored (v${version}): ${message}`;
  }

  // Superseded: "Superseded by v2: ..." or "Superseded by restored v2: ..."
  const supersededMatch = reason.match(/Superseded by (restored )?v(\d+): (.+)/);
  if (supersededMatch) {
    const [, restored, version, message] = supersededMatch;
    const prefix = restored ? 'restored ' : '';
    return `↗️ Superseded by ${prefix}v${version}: ${message}`;
  }

  // Initial setup
  if (reason.includes('Initial pricing setup')) {
    return `🚀 Initial pricing setup: ${reason.replace('Initial pricing setup', '').trim()}`;
  }

  // Manual activation
  if (reason.includes('Manually activated')) {
    return `👤 Manually activated: ${reason}`;
  }

  // Return as-is if no pattern matches
  return reason;
}

/**
 * Get a friendly status badge label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Active',
    archived: 'Archived',
    scheduled: 'Scheduled',
    suspended: 'Suspended',
    draft: 'Draft',
  };
  return labels[status] || status;
}

/**
 * Get a friendly event label
 */
export function getEventLabel(event: string): string {
  const labels: Record<string, string> = {
    created: 'Created',
    activated: 'Activated',
    archived: 'Archived',
    suspended: 'Suspended',
    restored: 'Restored',
  };
  return labels[event] || event;
}

/**
 * Truncate a reason to a maximum length
 */
export function truncateReason(reason: string | null, maxLength: number = 100): string {
  if (!reason) return '—';
  const formatted = formatCreationReason(reason);
  if (formatted.length <= maxLength) return formatted;
  return formatted.slice(0, maxLength) + '...';
}