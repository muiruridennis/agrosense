// app/dashboard/farms/[farmId]/poultry/components/DeleteRecordDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { FlockRecord } from "../types";

interface DeleteRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FlockRecord | null;
  onDeleteConfirm?: () => void;
  onSuccess?: () => void;
  isPending?: boolean;
}

export function DeleteRecordDialog({
  open,
  onOpenChange,
  record,
  onDeleteConfirm,
  onSuccess,
  isPending = false,
}: DeleteRecordDialogProps) {
  const handleDelete = () => {
    if (onDeleteConfirm) {
      onDeleteConfirm();
    } else if (onSuccess) {
      onSuccess();
    }
  };

  if (!record) return null;

  const canDelete = record.status === "draft";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Record</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            {canDelete ? (
              <>
                This action cannot be undone. This will permanently delete the
                record for{" "}
                <span className="font-semibold text-foreground">
                  {new Date(record.recordDate).toLocaleDateString()}
                </span>
                .
              </>
            ) : (
              <>
                <span className="font-semibold text-destructive">
                  Only draft records can be deleted.
                </span>{" "}
                This record is <span className="font-semibold">{record.status}</span> and cannot be removed.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isPending}
          >
            {isPending ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}