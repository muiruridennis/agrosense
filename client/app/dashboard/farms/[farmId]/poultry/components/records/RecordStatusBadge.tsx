"use client";

import { cn } from "@/lib/utils";

export type RecordStatus = "draft" | "submitted" | "reviewed" | "flagged";

interface RecordStatusBadgeProps {
  status: RecordStatus | string;
  className?: string;
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  draft: {
    label: "Draft",
    color:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    icon: "📝",
  },
  submitted: {
    label: "Pending Review",
    color:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    icon: "⏳",
  },
  reviewed: {
    label: "Approved",
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: "✅",
  },
  flagged: {
    label: "Needs Revision",
    color:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
    icon: "⚠️",
  },
};

export function RecordStatusBadge({
  status,
  className,
  showLabel = true,
}: RecordStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.color,
        className,
      )}
    >
      <span>{config.icon}</span>
      {showLabel && config.label}
    </span>
  );
}
