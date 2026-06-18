// app/dashboard/farms/[farmId]/poultry/components/PoultryHousesGrid.tsx
"use client";

import { useState } from "react";
import { usePoultryHouses } from "../hooks/usePoultry";
import { PoultryHouseCard } from "./PoultryHouseCard";
import { HouseForm } from "./HouseForm";
import { DeleteHouseDialog } from "./DeleteHouseDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PoultryHouse } from "../types";

interface PoultryHousesGridProps {
  farmId: string;
}

export function PoultryHousesGrid({ farmId }: PoultryHousesGridProps) {
  const { data: houses, isLoading, refetch } = usePoultryHouses(farmId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<PoultryHouse | null>(null);
  const [deletingHouse, setDeletingHouse] = useState<PoultryHouse | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const activeHouses = houses?.filter(h => h.isActive) || [];
  const totalCapacity = activeHouses.reduce((sum, h) => sum + h.capacity, 0);
  const totalFlocks = activeHouses.reduce((sum, h) => sum + (h.flocks?.length || 0), 0);

  const handleHouseUpdated = () => {
    refetch();
    setEditingHouse(null);
  };

  const handleHouseDeleted = () => {
    refetch();
    setDeletingHouse(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Poultry Houses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeHouses.length} active houses · {totalCapacity.toLocaleString()} bird capacity · {totalFlocks} active flocks
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New House
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Total Houses" value={houses?.length || 0} icon={Building2} />
        <StatCard title="Active Houses" value={activeHouses.length} icon={Building2} variant="success" />
        <StatCard title="Total Capacity" value={`${totalCapacity.toLocaleString()}`} subtitle="birds" icon={Building2} />
        <StatCard title="Active Flocks" value={totalFlocks} icon={Building2} variant="info" />
      </div>

      {/* Houses Grid */}
      {houses?.length === 0 ? (
        <EmptyState onCreate={() => setCreateDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {houses?.map((house) => (
            <PoultryHouseCard 
              key={house.id} 
              house={house} 
              farmId={farmId}
              onEdit={() => setEditingHouse(house)}
              onDelete={() => setDeletingHouse(house)}
            />
          ))}
        </div>
      )}

      {/* Create House Dialog */}
      <HouseForm
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        farmId={farmId}
        onSuccess={() => refetch()}
      />

      {/* Edit House Dialog */}
      <HouseForm
        open={!!editingHouse}
        onOpenChange={() => setEditingHouse(null)}
        farmId={farmId}
        editingHouse={editingHouse || undefined}
        onSuccess={handleHouseUpdated}
      />

      {/* Delete House Dialog */}
      <DeleteHouseDialog
        open={!!deletingHouse}
        onOpenChange={() => setDeletingHouse(null)}
        house={deletingHouse!}
        onSuccess={handleHouseDeleted}
      />
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, variant = "default" }: any) {
  const variants = {
    default: "bg-muted/30",
    success: "bg-emerald-50 dark:bg-emerald-950/30",
    info: "bg-blue-50 dark:bg-blue-950/30",
  };

  return (
    <div className={cn("rounded-xl p-3 text-center", variants[variant])}>
      <Icon className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{title}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/60">{subtitle}</p>}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
      <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
      <h3 className="text-lg font-semibold">No poultry houses yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        Create your first poultry house to start tracking flocks and production.
      </p>
      <Button onClick={onCreate} className="mt-4 gap-2">
        <Plus className="h-4 w-4" />
        Create Poultry House
      </Button>
    </div>
  );
}