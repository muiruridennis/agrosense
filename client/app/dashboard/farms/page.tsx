"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { FarmList } from "./components/FarmList";
import { CreateFarmDialog } from "./components/CreateFarmDialog";
import { EditFarmDialog } from "./components/EditFarmDialog";
import { DeleteFarmDialog } from "./components/DeleteFarmDialog";
import { useFarms } from "./hooks/useFarms";
import type { Farm } from "./types";

export default function FarmsPage() {
  const router = useRouter();
  const { data: farms, isLoading } = useFarms();
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deletingFarm, setDeletingFarm] = useState<Farm | null>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Farms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all your farming operations
          </p>
        </div>
        <CreateFarmDialog />
      </div>

      {/* Farm List */}
      <FarmList
        farms={farms || []}
        isLoading={isLoading}
        onEdit={setEditingFarm}
        onDelete={setDeletingFarm}
        onViewDetails={(farm) => {
        router.push(`/dashboard/farms/${farm.id}`);
        }}
      />

      {/* Dialogs */}
      <EditFarmDialog
        farm={editingFarm}
        open={!!editingFarm}
        onOpenChange={(open) => !open && setEditingFarm(null)}
      />

      <DeleteFarmDialog
        farm={deletingFarm}
        open={!!deletingFarm}
        onOpenChange={(open) => !open && setDeletingFarm(null)}
      />
    </div>
  );
}