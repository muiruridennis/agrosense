"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FarmsTable } from "./farms-table";
import { FarmFormModal } from "./components/farm-form-modal";
import { FarmDetailsSheet } from "./components/farm-details-sheet";
import {
  useFarms,
  useCreateFarm,
  useUpdateFarm,
  useDeleteFarm,
  farmKeys,
} from "@/lib/hooks/useDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { Farm, CreateFarmInput, UpdateFarmInput } from "@/types";

export default function FarmsPage() {
  // ── Modals state ───────────────────────────────────────────────────────────
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  // ── Data fetching and mutations ────────────────────────────────────────────
  const { data: farms = [], isPending: isFarmsPending } = useFarms();
  const createMutation = useCreateFarm();
  const updateMutation = useUpdateFarm(selectedFarm?.id ?? "");
  const deleteMutation = useDeleteFarm();
  const queryClient = useQueryClient();

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateClick = () => {
    setSelectedFarm(null);
    setFormModalOpen(true);
  };

  const handleViewFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setDetailsSheetOpen(true);
  };

  const handleEditFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setDetailsSheetOpen(false);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (data: CreateFarmInput | UpdateFarmInput) => {
    if (selectedFarm) {
      // Edit mode
      await updateMutation.mutateAsync(data as UpdateFarmInput);
    } else {
      // Create mode
      await createMutation.mutateAsync(data as CreateFarmInput);
    }
  };

  const handleDeleteFarm = async (farmId: string) => {
    await deleteMutation.mutateAsync(farmId);
  };

  const toolbar = (
    <Button onClick={handleCreateClick} size="sm" gap="md">
      <Plus className="h-4 w-4" />
      Create Farm
    </Button>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Farms</h1>
          <p className="text-muted-foreground">
            Manage all your farms and agricultural operations
          </p>
        </div>

        {/* Table */}
        <FarmsTable
          farms={farms}
          isPending={isFarmsPending}
          onView={handleViewFarm}
          onEdit={handleEditFarm}
          onDelete={handleDeleteFarm}
          isDeleting={deleteMutation.isPending}
          toolbar={toolbar}
        />
      </div>

      {/* Modals & Sheets */}
      <FarmFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        farm={selectedFarm}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <FarmDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        farm={selectedFarm}
        onEdit={handleEditFarm}
      />
    </>
  );
}
