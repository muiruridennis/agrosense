// app/dashboard/farms/[farmId]/poultry/components/DeleteFlockDialog.tsx
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
import { AlertTriangle, XCircle, Bird } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeleteFlock } from "../hooks/usePoultry";
import type { Flock } from "../types";

interface DeleteFlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flock: Flock;
  houseName: string;
  onSuccess?: () => void;
}

export function DeleteFlockDialog({ open, onOpenChange, flock, houseName, onSuccess }: DeleteFlockDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const deleteFlock = useDeleteFlock();

  const handleDelete = async () => {
    await deleteFlock.mutateAsync(flock.id);
    setConfirmText("");
    onOpenChange(false);
    onSuccess?.();
  };

  const isValid = confirmText === "DELETE";

  const hasRecords = (flock?.records?.length || 0) > 0;
  const isActive = flock?.status === "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-destructive">Delete Flock</DialogTitle>
          </div>
          <DialogDescription className="pt-3 text-muted-foreground">
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-semibold text-foreground">{flock?.breed}</span> from{" "}
            <span className="font-semibold text-foreground">{houseName}</span>.
          </DialogDescription>
        </DialogHeader>

        {isActive ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-foreground">
                  Cannot delete active flock
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This flock is currently <span className="font-semibold text-warning">ACTIVE</span>. 
                  You must close the flock before deleting it.
                </p>
                <div className="mt-3 rounded-md bg-muted/30 p-2 text-sm">
                  <span className="text-muted-foreground">Current birds:</span>{""}
                  <span className="ml-2 font-semibold text-foreground">{flock.currentCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : hasRecords ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-foreground">
                  This flock has {flock.records?.length} record(s)
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  All daily records, mortality data, and sales history will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <Bird className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  No records found. Safe to delete.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isActive && (
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
                disabled={!isValid || deleteFlock.isPending}
                className="gap-2"
              >
                {deleteFlock.isPending ? (
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