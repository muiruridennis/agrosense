// app/dashboard/farms/components/CreateFarmDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FarmForm } from "./FarmForm";
import { useCreateFarm } from "../hooks/useFarms";
import type { FarmFormData } from "../types";

export function CreateFarmDialog() {
  const [open, setOpen] = useState(false);
  const createFarm = useCreateFarm();

  const handleSubmit = async (data: FarmFormData) => {
    console.log("Creating farm with data:", data); // Debug log
    await createFarm.mutateAsync(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Farm
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Farm</DialogTitle>
        </DialogHeader>
        <FarmForm
          onSubmit={handleSubmit}
          isLoading={createFarm.isPending}
          submitLabel="Create Farm"
        />
      </DialogContent>
    </Dialog>
  );
}