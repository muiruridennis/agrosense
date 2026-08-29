// app/dashboard/farms/[farmId]/poultry/components/records/RecordDetailDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Pencil,
  X,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Send,
  Clock,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Droplet,
  Wheat,
  Egg,
  Weight,
  Target,
  Shield,
  DollarSign,
  Users,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordStatusBadge } from "./RecordStatusBadge";
import { formatDate, formatRelativeTime } from "@/utils/date";
import { useFarmRole } from "@/providers/FarmRoleContext";
import { useAuth } from "@/providers/auth-provider";

interface RecordDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  onReview?: () => void;
}

export function RecordDetailDialog({
  open,
  onOpenChange,
  record,
  onEdit,
  onDelete,
  onSubmit,
  onReview,
}: RecordDetailDialogProps) {
  const { role } = useFarmRole();
  const { user } = useAuth();
  const userId = user?.id;
  const isManager = role === "manager" || role === "owner";

  if (!record) return null;

  const canEdit =
    record.submittedById === userId &&
    (record.status === "draft" || record.status === "flagged");
  const canSubmit =
    record.submittedById === userId && record.status === "draft";
  const canDelete =
    record.submittedById === userId && record.status === "draft";
  const canReview = isManager && record.status === "submitted";

  const isLayers = record.flockType === "layers";
  const isBroilers = record.flockType === "broilers";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-3 text-lg">
                    Record Details
                    <RecordStatusBadge status={record.status} />
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {record.flock?.house?.name || "Flock"} · Day{" "}
                    {record.liveBirdsAfterRecord || 0}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 py-5 space-y-6">
          {/* ── Header Info ── */}
          <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">
                {formatDate(record.recordDate)}
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Recorded by:</span>
              <span className="font-medium">
                {record.submittedBy?.fullName || "Unknown"}
              </span>
            </div>
            {record.submittedAt && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Submitted {formatRelativeTime(record.submittedAt)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ── Key Metrics Grid ── */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCard
                icon={Users}
                label="Live Birds"
                value={record.liveBirdsAfterRecord?.toLocaleString() || "—"}
              />
              <MetricCard
                icon={AlertTriangle}
                label="Mortality"
                value={record.mortality || 0}
                highlight={record.mortality > 0}
                color="rose"
              />
              <MetricCard
                icon={AlertCircle}
                label="Sick Birds"
                value={record.sickBirds || 0}
                highlight={record.sickBirds > 0}
                color="amber"
              />
              <MetricCard
                icon={Wheat}
                label="Feed Consumed"
                value={`${record.feedConsumedKg || 0} kg`}
              />
              <MetricCard
                icon={Droplet}
                label="Water Consumed"
                value={
                  record.waterConsumedLitres
                    ? `${record.waterConsumedLitres} L`
                    : "—"
                }
              />
              <MetricCard
                icon={TrendingDown}
                label="Culls"
                value={record.culls || 0}
                highlight={record.culls > 0}
              />
            </div>
          </div>

          {/* ── Type-Specific Metrics ── */}
          {isLayers && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Egg className="h-4 w-4 text-amber-500" />
                Egg Production
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Production Rate"
                  value={`${record.productionRatePercent || 0}%`}
                />
                <MetricCard
                  label="Morning Eggs"
                  value={record.morningEggs || 0}
                />
                <MetricCard
                  label="Evening Eggs"
                  value={record.eveningEggs || 0}
                />
                <MetricCard
                  label="Broken Eggs"
                  value={record.brokenEggs || 0}
                  highlight={record.brokenEggs > 0}
                />
                <MetricCard
                  label="Dirty Eggs"
                  value={record.dirtyEggs || 0}
                  highlight={record.dirtyEggs > 0}
                />
              </div>
            </div>
          )}

          {isBroilers && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Weight className="h-4 w-4 text-blue-500" />
                Broiler Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Avg Weight"
                  value={
                    record.avgBodyWeightKg
                      ? `${record.avgBodyWeightKg} kg`
                      : "—"
                  }
                />
                <MetricCard
                  label="FCR"
                  value={record.feedConversionRatio?.toFixed(2) || "—"}
                />
                <MetricCard
                  label="Uniformity"
                  value={
                    record.uniformityPercent
                      ? `${record.uniformityPercent}%`
                      : "—"
                  }
                />
              </div>
            </div>
          )}

          {/* ── Health Risk ── */}
          {record.healthRiskScore !== null && record.healthRiskScore > 0 && (
            <div className="rounded-xl border p-4 bg-gradient-to-br from-card to-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Health Risk Score</span>
                </div>
                <Badge
                  className={cn(
                    "px-3 py-1 text-xs font-semibold",
                    record.healthRiskScore < 30 &&
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30",
                    record.healthRiskScore >= 30 &&
                      record.healthRiskScore < 60 &&
                      "bg-amber-100 text-amber-700 dark:bg-amber-950/30",
                    record.healthRiskScore >= 60 &&
                      "bg-rose-100 text-rose-700 dark:bg-rose-950/30",
                  )}
                >
                  {record.healthRiskScore.toFixed(1)} / 100
                </Badge>
              </div>
              {record.deviationFlags && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {record.deviationFlags.split(",").map((flag: string) => (
                    <Badge
                      key={flag}
                      variant="outline"
                      className="text-[9px] bg-muted/30"
                    >
                      {flag.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Remarks ── */}
          {record.remarks && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Remarks
              </h4>
              <div className="rounded-xl bg-muted/20 p-4 border border-border/50">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {record.remarks}
                </p>
              </div>
            </div>
          )}

          {/* ── Audit Trail ── */}
          {(record.submittedAt || record.reviewedAt) && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Audit Trail
              </h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
                {/* Submitted */}
                {record.submittedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 mt-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Send className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Submitted for Review
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.submittedBy?.fullName || "Unknown"} ·{" "}
                        {formatRelativeTime(record.submittedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reviewed */}
                {record.reviewedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 mt-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {record.status === "reviewed"
                          ? "Approved"
                          : "Flagged for Revision"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.reviewedBy?.fullName || "Unknown"} ·{" "}
                        {formatRelativeTime(record.reviewedAt)}
                      </p>
                      {record.reviewNote && (
                        <div className="mt-2 rounded-lg bg-muted/20 p-2 text-xs border border-border/50">
                          <span className="font-medium">Note:</span>{" "}
                          {record.reviewNote}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Financial Impact (Managers only) ── */}
          {isManager &&
            (record.feedCost > 0 ||
              record.eggRevenue > 0 ||
              record.mortalityCost > 0) && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Financial Impact
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <FinancialMetric
                    label="Feed Cost"
                    value={`KES ${record.feedCost?.toFixed(0) || 0}`}
                    color="blue"
                  />
                  <FinancialMetric
                    label="Egg Revenue"
                    value={`KES ${record.eggRevenue?.toFixed(0) || 0}`}
                    color="emerald"
                  />
                  <FinancialMetric
                    label="Mortality Cost"
                    value={`KES ${record.mortalityCost?.toFixed(0) || 0}`}
                    color="rose"
                  />
                </div>
              </div>
            )}
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t px-6 py-4">
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>

            {canSubmit && onSubmit && (
              <Button variant="default" onClick={onSubmit} className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Submit for Review
              </Button>
            )}

            {canReview && onReview && (
              <Button variant="default" onClick={onReview} className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Review Record
              </Button>
            )}

            {canEdit && onEdit && (
              <Button variant="outline" onClick={onEdit} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}

            {canDelete && onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                className="gap-1.5"
              >
                Delete
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  highlight = false,
  color = "default",
}: {
  icon?: React.ElementType;
  label: string;
  value: string | number;
  highlight?: boolean;
  color?: "default" | "rose" | "amber" | "emerald" | "blue";
}) {
  const colors = {
    default: "bg-muted/20",
    rose: "bg-rose-50 dark:bg-rose-950/20 border-rose-200/30 dark:border-rose-800/30",
    amber:
      "bg-amber-50 dark:bg-amber-950/20 border-amber-200/30 dark:border-amber-800/30",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-800/30",
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200/30 dark:border-blue-800/30",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-center transition-all hover:shadow-sm",
        colors[color],
        highlight && "border-rose-200 dark:border-rose-800",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "mx-auto h-4 w-4 mb-1",
            highlight ? "text-rose-500" : "text-muted-foreground",
          )}
        />
      )}
      <p
        className={cn("text-base font-semibold", highlight && "text-rose-600")}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground/70">{label}</p>
    </div>
  );
}

function FinancialMetric({
  label,
  value,
  color = "default",
}: {
  label: string;
  value: string;
  color?: "blue" | "emerald" | "rose" | "default";
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400",
    default: "bg-muted/20 text-foreground",
  };

  return (
    <div className={cn("rounded-xl p-3 text-center", colors[color])}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
