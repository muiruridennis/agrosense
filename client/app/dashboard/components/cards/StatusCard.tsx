import { cn } from "@/lib/utils";

type Severity = "critical" | "warning" | "good" | "neutral";

const SEVERITY: Record<
  Severity,
  {
    bar: string;
    badge: string;
    value: string;
  }
> = {
  critical: {
    bar: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    value: "text-destructive",
  },
  warning: {
    bar: "bg-warning",
    badge: "bg-warning/10 text-warning border-warning/20",
    value: "text-warning",
  },
  good: {
    bar: "bg-success",
    badge: "bg-success/10 text-success border-success/20",
    value: "text-success",
  },
  neutral: {
    bar: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
    value: "text-foreground",
  },
};
export function StatusCard({
  label,
  value,
  sub,
  badgeLabel,
  severity,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  badgeLabel: string;
  severity: Severity;
  onClick?: () => void;
}) {
  const s = SEVERITY[severity];
  return (
    <button
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md"
    >
      <div
        className={cn("absolute inset-y-0 left-0 w-[3px] rounded-r-sm", s.bar)}
      />

      <div className="mb-3 flex items-start justify-between pl-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]",
            s.badge,
          )}
        >
          {badgeLabel}
        </span>
      </div>

      <p
        className={cn(
          "pl-1 font-mono text-2xl font-medium leading-none tracking-tight",
          s.value,
        )}
      >
        {value}
      </p>
      <p className="mt-2 pl-1 text-[10px] leading-snug text-muted-foreground/70">
        {sub}
      </p>
    </button>
  );
}