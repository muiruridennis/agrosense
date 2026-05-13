"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CropsTable } from "./crops-table";
import { CropFormModal } from "./components/crop-form-modal";
import { CropDetailsSheet } from "./components/crop-details-sheet";
import {
  usePlots,
  useCropsByFarm,
  useCreateCrop,
  useUpdateCrop,
  useDeleteCrop,
  cropKeys,
  useFarms,
} from "@/lib/hooks/useDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { Crop, CreateCropInput, UpdateCropInput } from "@/types";

export default function CropsPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>(
    undefined,
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: farms = [] } = useFarms();
  const { data: plots = [] } = usePlots(selectedFarmId);
  const { data: crops = [], isPending: isCropsPending } =
    useCropsByFarm(selectedFarmId);

  // Set the first farm as default
  if (farms.length > 0 && !selectedFarmId) {
    setTimeout(() => setSelectedFarmId(farms[0].id), 0);
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useCreateCrop(selectedFarmId ?? "");
  const updateMutation = useUpdateCrop(
    selectedCrop?.id ?? "",
    selectedFarmId ?? "",
  );
  const deleteMutation = useDeleteCrop(selectedFarmId ?? "");

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateClick = () => {
    setSelectedCrop(null);
    setFormModalOpen(true);
  };

  const handleViewCrop = (crop: Crop) => {
    setSelectedCrop(crop);
    setDetailsSheetOpen(true);
  };

  const handleEditCrop = (crop: Crop) => {
    setSelectedCrop(crop);
    setDetailsSheetOpen(false);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (data: CreateCropInput | UpdateCropInput) => {
    if (selectedCrop) {
      // Edit mode
      await updateMutation.mutateAsync(data as UpdateCropInput);
    } else {
      // Create mode
      await createMutation.mutateAsync(data as CreateCropInput);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    await deleteMutation.mutateAsync(cropId);
  };

  const toolbar = (
    <Button
      onClick={handleCreateClick}
      size="sm"
      gap="md"
      disabled={!selectedFarmId || plots.length === 0}
    >
      <Plus className="h-4 w-4" />
      Add Crop
    </Button>
  );

  const emptyStateMessage =
    farms.length === 0
      ? "No farms found. Create a farm first."
      : plots.length === 0
        ? "No plots found in this farm. Create a plot first."
        : undefined;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Crops</h1>
          <p className="text-muted-foreground">
            Manage crop records across your farms
          </p>
        </div>

        {/* Farm Selector */}
        {farms.length > 0 && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Farm:</label>
            <select
              value={selectedFarmId || ""}
              onChange={(e) => setSelectedFarmId(e.target.value || undefined)}
              className="px-3 py-2 border border-input rounded-md text-sm bg-background"
            >
              <option value="">Select a farm...</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Table or Empty State */}
        {emptyStateMessage ? (
          <div className="flex items-center justify-center p-12 border border-dashed border-border rounded-lg text-center">
            <div>
              <p className="text-muted-foreground">{emptyStateMessage}</p>
            </div>
          </div>
        ) : (
          <CropsTable
            crops={crops}
            isPending={isCropsPending}
            onView={handleViewCrop}
            onEdit={handleEditCrop}
            onDelete={handleDeleteCrop}
            isDeleting={deleteMutation.isPending}
            toolbar={toolbar}
          />
        )}
      </div>

      {/* Modals & Sheets */}
      <CropFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        crop={selectedCrop}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        plots={plots}
        selectedPlotId={plots.length === 1 ? plots[0].id : undefined}
      />

      <CropDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        crop={selectedCrop}
        onEdit={handleEditCrop}
      />
    </>
  );
}
