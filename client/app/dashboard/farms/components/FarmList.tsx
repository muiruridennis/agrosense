"use client";

import { FarmCard } from "./FarmCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Farm } from "../types";
import { Sprout } from "lucide-react";

interface FarmListProps {
  farms: Farm[];
  isLoading: boolean;
  onEdit: (farm: Farm) => void;
  onDelete: (farm: Farm) => void;
  onViewDetails: (farm: Farm) => void;
}

export function FarmList({
  farms,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
}: FarmListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted/30 p-4 mb-4">
          <Sprout className="h-10 w-10 text-black" />
        </div>
        <h3 className="text-lg font-semibold">No farms yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          You haven't created any farms. Start by adding your first farming
          operation.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {farms.map((farm) => (
        <FarmCard
          key={farm.id}
          farm={farm}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
