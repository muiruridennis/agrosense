// app/dashboard/farms/[farmId]/components/PoultryHousesList.tsx
"use client";

import { useRouter } from "next/navigation";
import { Home, ChevronRight, TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { Farm } from "../../types";

interface PoultryHousesListProps {
  houses: Farm["poultryHouses"];
  farmId: string;
}

export function PoultryHousesList({ houses, farmId }: PoultryHousesListProps) {
  const router = useRouter();

  if (!houses?.length) return null;

  const totalCapacity = houses
    .filter((h) => h.isActive)
    .reduce((s, h) => s + h.capacity, 0);

  const occupiedCapacity = Math.floor(totalCapacity * 0.85); // Example occupancy

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Poultry Houses</h3>
            <p className="text-xs text-muted-foreground">
              {houses.filter(h => h.isActive).length} active houses · {totalCapacity.toLocaleString()} bird capacity
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">85% occupied</p>
          <Progress value={85} className="mt-1 h-1.5 w-24" />
        </div>
      </div>

      <div className="divide-y">
        {houses.map((house) => (
          <button
            key={house.id}
            onClick={() => router.push(`/dashboard/farms/${farmId}/poultry/houses/${house.id}`)}
            className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-all hover:bg-muted/30"
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
              house.isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}>
              {house.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground">{house.name}</p>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase",
                  house.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}>
                  {house.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="capitalize">{house.houseType?.replace("_", " ")}</span>
                <span>•</span>
                <span>Capacity: {house.capacity.toLocaleString()} birds</span>
                {house.notes && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{house.notes}</span>
                  </>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}