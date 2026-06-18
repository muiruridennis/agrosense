// app/dashboard/farms/components/DeleteFarmDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { useDeleteFarm } from "../hooks/useFarms";
import type { Farm } from "../types";

interface DeleteFarmDialogProps {
  farm: Farm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteFarmDialog({
  farm,
  open,
  onOpenChange,
}: DeleteFarmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const deleteFarm = useDeleteFarm();

  const handleDelete = async () => {
    if (!farm) return;
    await deleteFarm.mutateAsync(farm.id);
    onOpenChange(false);
    setConfirmText("");
  };

  if (!farm) return null;

  const isValid = confirmText === "DELETE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Farm</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-semibold text-foreground">{farm.name}</span>{" "}
            and all associated data including plots, records, and members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Please type{" "}
            <span className="font-semibold text-foreground">DELETE</span> to
            confirm.
          </p>
          <Input
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="font-mono"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isValid || deleteFarm.isPending}
          >
            {deleteFarm.isPending ? "Deleting..." : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
