// components/charts/InventoryStatus.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartSkeleton } from "./shared/ChartSkeleton";

interface InventoryItem {
  name: string;
  daysSupply: number;
  status: "CRITICAL" | "LOW" | "ADEQUATE" | "EXCESS";
}

interface InventoryStatusProps {
  items: InventoryItem[];
  isLoading?: boolean;
}

export function InventoryStatus({ items, isLoading }: InventoryStatusProps) {
  if (isLoading) return <ChartSkeleton />;

  const critical = items.filter(i => i.status === "CRITICAL");
  const low = items.filter(i => i.status === "LOW");

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Critical Inventory</h3>
      </div>

      {critical.length === 0 && low.length === 0 ? (
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          <p className="text-sm">All stock levels adequate</p>
        </div>
      ) : (
        <div className="space-y-3">
          {critical.map(item => (
            <div key={item.name} className="flex items-center justify-between border-b border-red-100 pb-2">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-red-600">CRITICAL - Order immediately</p>
              </div>
              <p className="text-sm font-bold text-red-600">{item.daysSupply === 0 ? "OUT" : `${item.daysSupply}d`}</p>
            </div>
          ))}
          {low.map(item => (
            <div key={item.name} className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-amber-600">Low stock - Reorder soon</p>
              </div>
              <p className="text-sm font-medium text-amber-600">{item.daysSupply}d left</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}