// app/dashboard/farms/components/EditFarmDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FarmForm } from "./FarmForm";
import { useUpdateFarm } from "../hooks/useFarms";
import type { Farm, FarmFormData } from "../types";

interface EditFarmDialogProps {
  farm: Farm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditFarmDialog({ farm, open, onOpenChange }: EditFarmDialogProps) {
  const updateFarm = useUpdateFarm();

  const handleSubmit = async (data: FarmFormData) => {
    if (!farm) return;
    await updateFarm.mutateAsync({ id: farm.id, data });
    onOpenChange(false);
  };

  if (!farm) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Farm</DialogTitle>
        </DialogHeader>
        <FarmForm
          defaultValues={farm}
          onSubmit={handleSubmit}
          isLoading={updateFarm.isPending}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}