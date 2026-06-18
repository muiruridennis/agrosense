// app/dashboard/farms/[farmId]/layout.tsx
"use client";

import { useParams } from "next/navigation";
import { FarmContextBar } from "./components/FarmContextBar.tsx";
import { FarmSidebar } from "./components/FarmSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFarm } from "../hooks/useFarms";

export default function FarmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { farmId } = useParams();
  const { data: farm, isLoading } = useFarm(farmId as string);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-6">
          <Skeleton className="h-[calc(100vh-120px)] w-64" />
          <Skeleton className="flex-1" />
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Farm not found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The farm you're looking for doesn't exist or you don't have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FarmContextBar farm={farm} />
      <div className="flex gap-6">
        <FarmSidebar farmId={farm.id} farmName={farm.name} />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}