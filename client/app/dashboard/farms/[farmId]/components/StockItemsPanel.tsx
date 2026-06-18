// app/dashboard/farms/[farmId]/components/StockItemsPanel.tsx
"use client";

import { useRouter } from "next/navigation";
import { Package, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Farm } from "../../types";

interface StockItemsPanelProps {
  items: Farm["stockItems"];
  farmId: string;
}

export function StockItemsPanel({ items, farmId }: StockItemsPanelProps) {
  const router = useRouter();

  if (!items?.length) return null;

  const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category ?? "other";
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  const CATEGORY_ICON: Record<string, string> = {
    feed: "🌾",
    medication: "💊",
    equipment: "🔧",
    other: "📦",
  };

  const CATEGORY_COLOR: Record<string, string> = {
    feed: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20",
    medication: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
    equipment: "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
    other: "border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20",
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
            <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Inventory</h3>
            <p className="text-xs text-muted-foreground">
              {items.length} tracked items · {Object.keys(byCategory).length} categories
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/farms/${farmId}/inventory`)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Manage →
        </button>
      </div>

      <div className="divide-y">
        {Object.entries(byCategory).map(([cat, catItems]) => (
          <div key={cat} className={cn("px-5 py-3", CATEGORY_COLOR[cat] ?? CATEGORY_COLOR.other)}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{CATEGORY_ICON[cat] ?? "📦"}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </span>
              <Badge variant="outline" className="text-[9px]">
                {catItems.length}
              </Badge>
            </div>
            <div className="space-y-1">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/50 dark:hover:bg-black/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      Min: {item.minStockLevel?.toLocaleString()} {item.unit}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}