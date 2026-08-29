// app/dashboard/farms/[farmId]/poultry/components/records/ReviewPanel.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RecordStatusBadge } from "./RecordStatusBadge";
import { CheckCircle2, Flag, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  onReview: (status: "reviewed" | "flagged", note?: string) => void;
  isPending?: boolean;
}

export function ReviewPanel({
  open,
  onOpenChange,
  record,
  onReview,
  isPending,
}: ReviewPanelProps) {
  const [reviewNote, setReviewNote] = useState("");
  const [selectedAction, setSelectedAction] = useState<
    "reviewed" | "flagged" | null
  >(null);

  if (!record) return null;

  const handleReview = () => {
    if (selectedAction) {
      onReview(
        selectedAction,
        selectedAction === "flagged" ? reviewNote : undefined,
      );
    }
  };

  const isFlaggedAction = selectedAction === "flagged";
  const canSubmit =
    selectedAction && (!isFlaggedAction || reviewNote.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Record</DialogTitle>
          <DialogDescription>
            Review the record and either approve it or flag it for revision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Record Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {new Date(record.recordDate).toLocaleDateString()}
              </span>
              <RecordStatusBadge status={record.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Mortality:</span>
                <span className="ml-1 font-medium">
                  {record.mortality || 0}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Feed:</span>
                <span className="ml-1 font-medium">
                  {record.feedConsumedKg || 0} kg
                </span>
              </div>
              {record.productionRatePercent && (
                <div>
                  <span className="text-muted-foreground">Production:</span>
                  <span className="ml-1 font-medium">
                    {record.productionRatePercent}%
                  </span>
                </div>
              )}
              {record.avgBodyWeightKg && (
                <div>
                  <span className="text-muted-foreground">Avg Weight:</span>
                  <span className="ml-1 font-medium">
                    {record.avgBodyWeightKg} kg
                  </span>
                </div>
              )}
            </div>

            {record.remarks && (
              <p className="text-sm text-muted-foreground border-t pt-2">
                {record.remarks}
              </p>
            )}

            <div className="text-xs text-muted-foreground border-t pt-2">
              <span>Submitted by: </span>
              <span className="font-medium">
                {record.submittedBy?.fullName || "Unknown"}
              </span>
            </div>
          </div>

          {/* Health Risk Alert */}
          {record.healthRiskScore && record.healthRiskScore > 60 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950/20">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
                ⚠️ High Health Risk
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-500">
                Health risk score is {record.healthRiskScore}. Recommend
                immediate attention.
              </p>
            </div>
          )}

          {/* Review Actions */}
          <div className="space-y-3">
            <Label>Review Decision</Label>
            <div className="flex gap-2">
              <Button
                variant={selectedAction === "reviewed" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setSelectedAction("reviewed")}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant={
                  selectedAction === "flagged" ? "destructive" : "outline"
                }
                className="flex-1 gap-2"
                onClick={() => setSelectedAction("flagged")}
              >
                <Flag className="h-4 w-4" />
                Flag
              </Button>
            </div>

            {isFlaggedAction && (
              <div className="space-y-2">
                <Label htmlFor="reviewNote">Review Note (Required)</Label>
                <Textarea
                  id="reviewNote"
                  placeholder="Explain what needs to be corrected..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  className={cn(
                    !reviewNote.trim() &&
                      "border-rose-300 focus-visible:ring-rose-500",
                  )}
                />
                {!reviewNote.trim() && (
                  <p className="text-xs text-rose-600">
                    A note is required when flagging a record
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={!canSubmit || isPending}
              variant={selectedAction === "flagged" ? "destructive" : "default"}
              className="flex-1"
            >
              {isPending ? "Processing..." : "Confirm Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
