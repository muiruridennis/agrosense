// app/dashboard/farms/[farmId]/poultry/components/DeleteHouseDialog.tsx
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
import { AlertTriangle, Home, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeletePoultryHouse } from "../hooks/usePoultry";
import type { PoultryHouse } from "../types";

interface DeleteHouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house: PoultryHouse;
  onSuccess?: () => void;
}

export function DeleteHouseDialog({ open, onOpenChange, house, onSuccess }: DeleteHouseDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const deleteHouse = useDeletePoultryHouse();

  const handleDelete = async () => {
    await deleteHouse.mutateAsync(house.id);
    setConfirmText("");
    onOpenChange(false);
    onSuccess?.();
  };

  const isValid = confirmText === "DELETE";

  // Check if house has active flocks
  const hasActiveFlocks = house?.flocks?.some(f => f.status === "active") || false;
  const hasFlocks = (house?.flocks?.length || 0) > 0;
  const totalBirds = house?.flocks?.reduce((sum, f) => sum + f.currentCount, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-destructive">Delete Poultry House</DialogTitle>
          </div>
          <DialogDescription className="pt-3 text-muted-foreground">
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-semibold text-foreground">{house?.name}</span> and all associated data.
          </DialogDescription>
        </DialogHeader>

        {hasActiveFlocks ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-foreground">
                  Cannot delete house with active flocks
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This house has active flocks that must be closed or moved first.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {house.flocks?.filter(f => f.status === "active").map(f => (
                    <li key={f.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{f.breed}</span>
                      <span className="text-muted-foreground">{f.currentCount} birds</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : hasFlocks ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-foreground">
                  This house has {house.flocks?.length} closed flock(s)
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total of {totalBirds.toLocaleString()} birds. All flock data will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  House has no flocks. Safe to delete.
                </p>
              </div>
            </div>
          </div>
        )}

        {!hasActiveFlocks && (
          <>
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Type <span className="font-semibold text-destructive">DELETE</span> to confirm permanent deletion.
              </p>
              <Input
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={cn(
                  "font-mono",
                  confirmText && confirmText !== "DELETE" && "border-destructive/50 focus-visible:ring-destructive"
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isValid || deleteHouse.isPending}
                className="gap-2"
              >
                {deleteHouse.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}