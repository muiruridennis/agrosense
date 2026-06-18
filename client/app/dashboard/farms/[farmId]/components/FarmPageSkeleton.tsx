// app/dashboard/farms/[farmId]/skeleton/FarmPageSkeleton.tsx
"use client";

import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted/60", className)} />;
}

export function FarmPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-[1400px] space-y-5 p-5">
        {/* Context bar skeleton */}
        <div className="flex items-center gap-4">
          <Pulse className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <Pulse className="h-5 w-48" />
            <Pulse className="h-3.5 w-64" />
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="flex gap-2">
          <Pulse className="h-8 w-20" />
          <Pulse className="h-8 w-24" />
          <Pulse className="h-8 w-20" />
        </div>

        {/* KPI strip skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Pulse key={i} className="h-24" />
          ))}
        </div>

        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            {/* Enterprise modules skeleton */}
            <div className="space-y-3">
              <Pulse className="h-4 w-32" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Pulse key={i} className="h-32" />
                ))}
              </div>
            </div>
            <Pulse className="h-48" />
          </div>
          <div className="space-y-4">
            <Pulse className="h-64" />
            <Pulse className="h-48" />
            <Pulse className="h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}