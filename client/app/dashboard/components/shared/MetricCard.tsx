// Shared MetricCard Component
interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  isAlert?: boolean;
}

export function MetricCard({ label, value, unit, isAlert }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <p
          className={`text-lg font-semibold ${
            isAlert ? "text-red-600 dark:text-red-400" : ""
          }`}
        >
          {value}
        </p>
        {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
      </div>
    </div>
  );
}