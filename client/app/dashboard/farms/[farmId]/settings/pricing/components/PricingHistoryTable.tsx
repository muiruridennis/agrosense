// app/dashboard/farms/[farmId]/settings/pricing/components/PricingHistoryTable.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Archive,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingHistory, PricingTier } from "@/types";

interface PricingHistoryTableProps {
  history: PricingHistory[];
  total: number;
  farmId: string;
  onView?: (history: PricingHistory) => void;
  onArchive?: (history: PricingHistory) => void;
  onRestore?: (history: PricingHistory) => void;
  onSuspend?: (history: PricingHistory) => void;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  itemsPerPage?: number;
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

export function PricingHistoryTable({
  history,
  total,
  farmId,
  onView,
  onArchive,
  onRestore,
  onSuspend,
  isLoading = false,
  onPageChange,
  currentPage = 1,
  itemsPerPage = 10,
}: PricingHistoryTableProps) {
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    if (onPageChange) {
      onPageChange(page);
    }
  }, [page, onPageChange]);

  const totalPages = Math.ceil(total / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getEventBadge = (event: string) => {
    const config = EVENT_CONFIG[event] || EVENT_CONFIG.created;
    const Icon = config.icon;
    return (
      <Badge
        className={cn(
          "flex w-fit items-center gap-1 text-xs font-medium",
          config.color,
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return <PricingHistorySkeleton />;
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted/20 p-4 mb-3">
          <Clock className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          No pricing history
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Create your first pricing tier to start tracking changes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Events" value={total} />
        <StatCard
          label="Activated"
          value={history.filter((h) => h.event === "activated").length}
          color="emerald"
        />
        <StatCard
          label="Archived"
          value={history.filter((h) => h.event === "archived").length}
          color="gray"
        />
        <StatCard
          label="Suspended"
          value={history.filter((h) => h.event === "suspended").length}
          color="rose"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">
                  Event
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">
                  Tier
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Feed
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Eggs
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Broiler
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Mortality
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">
                  Actor
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">
                  Time
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry, index) => {
                const isEven = index % 2 === 0;

                return (
                  <TableRow
                    key={entry.id}
                    className={cn(
                      "transition-colors hover:bg-muted/30",
                      isEven && "bg-muted/5",
                    )}
                  >
                    <TableCell>{getEventBadge(entry.event)}</TableCell>

                    <TableCell className="font-mono text-sm">
                      v
                      {history.findIndex(
                        (h) => h.pricingTierId === entry.pricingTierId,
                      ) + 1 || "?"}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      {entry.prices?.feedCostPerKg}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      {entry.prices?.eggPricePerTray}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      {entry.prices?.broilerPricePerKg}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      {entry.prices?.mortalityCostPerBird}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px] bg-muted">
                            {getInitials(entry.actedByUser?.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {entry.actedByUser?.fullName || "Unknown"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(entry.eventDate)}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView?.(entry)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>

                          {/* Show suspend/restore based on event type */}
                          {entry.event === "activated" && (
                            <DropdownMenuItem
                              onClick={() => onSuspend?.(entry)}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}

                          {entry.event === "suspended" && (
                            <DropdownMenuItem
                              onClick={() => onRestore?.(entry)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          )}

                          {entry.event === "created" && (
                            <DropdownMenuItem
                              onClick={() => onArchive?.(entry)}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * itemsPerPage + 1} to{" "}
              {Math.min(page * itemsPerPage, total)} of {total} events
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = "default",
}: {
  label: string;
  value: number;
  color?: "default" | "emerald" | "gray" | "amber" | "rose" | "blue";
}) {
  const colors = {
    default: "bg-muted/20",
    emerald: "bg-emerald-50 dark:bg-emerald-950/20",
    gray: "bg-gray-50 dark:bg-gray-900/20",
    amber: "bg-amber-50 dark:bg-amber-950/20",
    rose: "bg-rose-50 dark:bg-rose-950/20",
    blue: "bg-blue-50 dark:bg-blue-950/20",
  };

  const textColors = {
    default: "text-foreground",
    emerald: "text-emerald-700 dark:text-emerald-400",
    gray: "text-gray-700 dark:text-gray-400",
    amber: "text-amber-700 dark:text-amber-400",
    rose: "text-rose-700 dark:text-rose-400",
    blue: "text-blue-700 dark:text-blue-400",
  };

  return (
    <div className={cn("rounded-xl p-3 text-center", colors[color])}>
      <p className={cn("text-2xl font-bold", textColors[color])}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function PricingHistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="border-t p-3 flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
