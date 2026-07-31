// utils/time-utils.ts
export function formatTimeDuration(seconds: number): string {
  if (seconds < 0) return 'already expired';

  const units = [
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.seconds);
    if (value >= 1) {
      return `${value} ${unit.label}${value > 1 ? 's' : ''}`;
    }
  }

  return 'just now';
}

