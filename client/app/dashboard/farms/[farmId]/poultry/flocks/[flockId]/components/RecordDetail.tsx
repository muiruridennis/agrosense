// app/dashboard/farms/[farmId]/poultry/components/RecordDetailDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Thermometer, Droplets, Egg, Wheat, ShieldAlert, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlockRecord } from "../types";

interface RecordDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FlockRecord;
  flockType: string;
  onEdit: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-muted text-muted-foreground",
  submitted: "bg-info/10 text-info",
  reviewed:  "bg-success/10 text-success",
  flagged:   "bg-destructive/10 text-destructive",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function RecordDetailDialog({
  open,
  onOpenChange,
  record,
  flockType,
  onEdit,
}: RecordDetailDialogProps) {
  const canEdit = record.status === "draft";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-evenly gap-3">
            <DialogTitle className="flex items-center gap-2">
              Record · {new Date(record.recordDate).toLocaleDateString(undefined, {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </DialogTitle>
            <span className={cn(
              "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              STATUS_STYLES[record.status] ?? STATUS_STYLES.draft,
            )}>
              {record.status}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Production */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              {flockType === "layers" ? <Egg className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
              Production
            </p>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
              {flockType === "layers" ? (
                <>
                  <Field label="Morning eggs" value={record.morningEggs ?? "—"} />
                  <Field label="Evening eggs" value={record.eveningEggs ?? "—"} />
                  <Field label="Broken eggs" value={record.brokenEggs ?? "—"} />
                  <Field label="Dirty eggs" value={record.dirtyEggs ?? "—"} />
                  <Field
                    label="Production rate"
                    value={record.productionRatePercent != null ? `${record.productionRatePercent}%` : "—"}
                  />
                  <Field
                    label="Egg revenue"
                    value={record.eggRevenue != null ? `KES ${record.eggRevenue.toLocaleString()}` : "—"}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Avg body weight"
                    value={record.avgBodyWeightKg != null ? `${record.avgBodyWeightKg} kg` : "—"}
                  />
                  <Field label="Sample size" value={record.sampleSize ?? "—"} />
                  <Field
                    label="Feed conversion ratio"
                    value={record.feedConversionRatio ?? "—"}
                  />
                  <Field
                    label="Uniformity"
                    value={record.uniformityPercent != null ? `${record.uniformityPercent}%` : "—"}
                  />
                </>
              )}
            </div>
          </section>

          {/* Health & mortality */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" />
              Health &amp; mortality
            </p>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
              <Field label="Mortality" value={record.mortality ?? 0} />
              <Field label="Culls" value={record.culls ?? 0} />
              <Field label="Sick birds" value={record.sickBirds ?? 0} />
              <Field
                label="Health risk score"
                value={record.healthRiskScore != null ? record.healthRiskScore.toFixed(1) : "—"}
              />
              <Field label="Medication" value={record.medication || "None"} />
              <Field
                label="Mortality cost"
                value={record.mortalityCost != null ? `KES ${record.mortalityCost.toLocaleString()}` : "—"}
              />
            </div>
          </section>

          {/* Environment & feed */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Wheat className="h-3.5 w-3.5" />
              Feed &amp; environment
            </p>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
              <Field
                label="Feed consumed"
                value={record.feedConsumedKg != null ? `${record.feedConsumedKg} kg` : "—"}
              />
              <Field label="Feed type" value={record.feedType || "—"} />
              <Field
                label="Feed cost"
                value={record.feedCost != null ? `KES ${record.feedCost.toLocaleString()}` : "—"}
              />
              <Field
                label="Water consumed"
                value={record.waterConsumedLitres != null ? `${record.waterConsumedLitres} L` : "—"}
              />
              <Field
                label="Temperature"
                value={record.temperatureCelsius != null ? `${record.temperatureCelsius}°C` : "—"}
              />
              <Field label="Live birds after" value={record.liveBirdsAfterRecord ?? "—"} />
            </div>
          </section>

          {/* Remarks */}
          {record.remarks && (
            <section>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Remarks</p>
              <p className="rounded-lg border bg-muted/20 p-3 text-sm text-foreground">
                {record.remarks}
              </p>
            </section>
          )}

          {/* Review note, if flagged or reviewed */}
          {record.reviewNote && (
            <section>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Review note</p>
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {record.reviewNote}
              </p>
            </section>
          )}

          {/* Submitted by */}
          {record.submittedBy?.fullName && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              Submitted by {record.submittedBy.fullName}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit} disabled={!canEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}