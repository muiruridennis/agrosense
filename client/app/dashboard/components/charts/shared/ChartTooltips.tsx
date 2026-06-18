// components/charts/shared/ChartTooltips.tsx
"use client";

import { cn } from "@/lib/utils";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload?: Record<string, any>;
  }>;
  label?: string;
  formatter?: (value: number) => string;
}

export function CustomTooltip({ active, payload, label, formatter }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const formatValue = formatter || ((v: number) => `KES ${v.toLocaleString()}`);

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-xs font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}:</span>
            </div>
            <span className="font-mono font-medium">
              {formatValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductionTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const eggs = payload.find(p => p.name === "Eggs" || p.name === "eggs")?.value;
  const target = payload.find(p => p.name === "Target" || p.name === "target")?.value;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-xs font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Production:</span>
          <span className="font-mono font-medium">{eggs?.toLocaleString()} eggs</span>
        </div>
        {target && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Target:</span>
            <span className="font-mono font-medium">{target.toLocaleString()} eggs</span>
          </div>
        )}
        {target && eggs && (
          <div className="mt-1 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Achievement:</span>
              <span className={cn(
                "font-mono font-medium",
                eggs >= target ? "text-emerald-600" : "text-amber-600"
              )}>
                {((eggs / target) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MortalityTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const rate = payload.find(p => p.name === "Mortality Rate" || p.name === "rate")?.value;
  const deaths = payload[0]?.payload?.deaths;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-xs font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Mortality Rate:</span>
          <span className={cn(
            "font-mono font-medium",
            rate && rate > 2 ? "text-red-600" : "text-amber-600"
          )}>
            {rate?.toFixed(1)}%
          </span>
        </div>
        {deaths !== undefined && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Total Deaths:</span>
            <span className="font-mono font-medium">{deaths.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}