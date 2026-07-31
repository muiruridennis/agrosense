// app/dashboard/farms/[farmId]/settings/pricing/components/PricingDetailDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  FileText,
  DollarSign,
  Package,
  Egg,
  Weight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Archive,
  RotateCcw,
  Pause,
  Play,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/utils/date";
import { PricingHistory } from "@/types";

interface PricingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: PricingHistory | null;
}

const EVENT_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  created: {
    label: "Created",
    color:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    icon: Clock,
  },
  activated: {
    label: "Activated",
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: Play,
  },
  archived: {
    label: "Archived",
    color:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400",
    icon: Archive,
  },
  suspended: {
    label: "Suspended",
    color:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
    icon: Pause,
  },
  restored: {
    label: "Restored",
    color:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    icon: RotateCcw,
  },
};

export function PricingDetailDialog({
  open,
  onOpenChange,
  history,
}: PricingDetailDialogProps) {
  if (!history) return null;

  const eventConfig = EVENT_CONFIG[history.event] || EVENT_CONFIG.created;
  const StatusIcon = eventConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                Pricing Event Details
                <Badge className={cn("text-xs font-medium", eventConfig.color)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {eventConfig.label}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Event ID: {history.id.slice(0, 8)}...
              </DialogDescription>
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
        </DialogHeader>

        <Separator />

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Event Date:</span>
              <span className="font-medium">
                {formatDate(history.eventDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Acted by:</span>
              <span className="font-medium">
                {history.actedByUser?.fullName || "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pricing Tier:</span>
              <span className="font-medium">
                {history.pricingTierId.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* Pricing Values at Time of Event */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Pricing Values at Event
            </h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard
                icon={Package}
                label="Feed Price"
                value={`KES ${history.prices?.feedCostPerKg}/kg`}
              />
              <MetricCard
                icon={Egg}
                label="Egg Price"
                value={`KES ${history.prices?.eggPricePerTray}/tray`}
              />
              <MetricCard
                icon={Weight}
                label="Broiler Price"
                value={`KES ${history.prices?.broilerPricePerKg}/kg`}
              />
              <MetricCard
                icon={AlertCircle}
                label="Mortality Cost"
                value={`KES ${history.prices?.mortalityCostPerBird}/bird`}
              />
            </div>
          </div>

          {/* Reason */}
          {history.eventReason && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Reason
              </h4>
              <div className="rounded-lg bg-muted/20 p-3 text-sm">
                {history.eventReason}
              </div>
            </div>
          )}

          {/* Audit Trail */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Audit Trail
            </h4>
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Event Type</span>
                <span className="font-medium">{history.event}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Event Date</span>
                <span>{formatDate(history.eventDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Record Created</span>
                <span>{formatRelativeTime(history.createdAt)}</span>
              </div>
              {history.actedByUser && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Acted By</span>
                  <span>{history.actedByUser.fullName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/20 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
