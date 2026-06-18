"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-50 w-full" />
    </Card>
  );
}