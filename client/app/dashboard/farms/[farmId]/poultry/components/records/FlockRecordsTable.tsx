// app/dashboard/farms/[farmId]/poultry/components/records/FlockRecordsTable.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Send,
  CheckCircle2,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordStatusBadge } from "./RecordStatusBadge";
import { useFarmRole } from "@/providers/FarmRoleContext";
import type { Flock, FlockRecord } from "@/types";
import { useAuth } from "@/providers/auth-provider";

interface FlockRecordsTableProps {
  flock: Flock;
  records: FlockRecord[];
  onView: (record: FlockRecord) => void;
  onEdit: (record: FlockRecord) => void;
  onDelete: (record: FlockRecord) => void;
  onSubmit: (record: FlockRecord) => void;
  onReview: (record: FlockRecord) => void;
}

export function FlockRecordsTable({
  flock,
  records,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  onReview,
}: FlockRecordsTableProps) {
  const { role } = useFarmRole();
  const { user } = useAuth();
  const userId = user?.id;
  const isManager = role === "manager" || role === "owner";

  const isLayers = flock.type === "layers";
  const isBroilers = flock.type === "broilers";

  // Permission checks
  const canEdit = (record: FlockRecord) => {
    return (
      record.submittedById === userId &&
      (record.status === "draft" || record.status === "flagged")
    );
  };

  const canSubmit = (record: FlockRecord) => {
    return record.submittedById === userId && record.status === "draft";
  };

  // Option 1: Owner can delete any record (full authority)
  const canDelete = (record: FlockRecord) => {
    // Owner can delete any record
    if (role === "owner") return true;

    // Worker/Manager can only delete their own drafts
    return record.submittedById === userId && record.status === "draft";
  };

  const canReview = (record: FlockRecord) => {
    return isManager && record.status === "submitted";
  };

  const canView = (record: FlockRecord) => {
    return true; // Everyone can view
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No records yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click "Add Record" to start tracking daily data
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              Date
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
              Live Birds
            </TableHead>

            {isLayers && (
              <>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Eggs
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Broken
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Dirty
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Prod %
                </TableHead>
              </>
            )}

            {isBroilers && (
              <>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Weight
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  Uniformity
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                  FCR
                </TableHead>
              </>
            )}

            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
              Mortality
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
              Sick
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
              Feed
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
              Water
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
              Health Risk
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              Recorded By
            </TableHead>
            <TableHead className="w-12 text-right text-xs font-semibold uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {records.map((record, index) => {
            const isEven = index % 2 === 0;
            const canEditRecord = canEdit(record);
            const canSubmitRecord = canSubmit(record);
            const canDeleteRecord = canDelete(record);
            const canReviewRecord = canReview(record);

            return (
              <TableRow
                key={record.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/30",
                  isEven && "bg-muted/5",
                )}
                onClick={() => onView(record)}
              >
                <TableCell className="font-mono text-sm">
                  {new Date(record.recordDate).toLocaleDateString()}
                </TableCell>

                <TableCell>
                  <RecordStatusBadge status={record.status} />
                </TableCell>

                <TableCell className="text-right font-mono">
                  {record.liveBirdsAfterRecord?.toLocaleString() || "—"}
                </TableCell>

                {isLayers && (
                  <>
                    <TableCell className="text-right font-mono">
                      {(record.morningEggs || 0) + (record.eveningEggs || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {record.brokenEggs || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {record.dirtyEggs || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {record.productionRatePercent?.toFixed(1) || 0}%
                    </TableCell>
                  </>
                )}

                {isBroilers && (
                  <>
                    <TableCell className="text-right font-mono">
                      {record.avgBodyWeightKg?.toFixed(2) || "—"} kg
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {record.uniformityPercent?.toFixed(1) || "—"}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {record.feedConversionRatio?.toFixed(2) || "—"}
                    </TableCell>
                  </>
                )}

                <TableCell className="text-right font-mono">
                  {(record.mortality || 0) > 0 ? (
                    <span className="font-semibold text-destructive">
                      {record.mortality}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {record.sickBirds || 0}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {record.feedConsumedKg?.toFixed(0) || 0} kg
                </TableCell>

                <TableCell className="text-right font-mono">
                  {record.waterConsumedLitres?.toFixed(0) || 0} L
                </TableCell>

                <TableCell className="text-right">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-mono",
                      (record.healthRiskScore || 0) < 30 &&
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30",
                      (record.healthRiskScore || 0) >= 30 &&
                        (record.healthRiskScore || 0) < 60 &&
                        "bg-amber-100 text-amber-700 dark:bg-amber-950/30",
                      (record.healthRiskScore || 0) >= 60 &&
                        "bg-rose-100 text-rose-700 dark:bg-rose-950/30",
                    )}
                  >
                    {record.healthRiskScore?.toFixed(1) || "—"}
                  </span>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {record.submittedBy?.fullName || "—"}
                </TableCell>

                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    {/* ✅ Submit Button - for draft records owned by worker */}
                    {canSubmitRecord && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onSubmit(record)}
                        className="h-7 gap-1 text-xs"
                      >
                        <Send className="h-3 w-3" />
                        Submit
                      </Button>
                    )}

                    {/* ✅ Review Button - for managers */}
                    {canReviewRecord && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReview(record)}
                        className="h-7 gap-1 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Review
                      </Button>
                    )}

                    {/* ✅ Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onView(record)}>
                          <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                        </DropdownMenuItem>

                        {canEditRecord && (
                          <DropdownMenuItem onClick={() => onEdit(record)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        )}

                        {canSubmitRecord && (
                          <DropdownMenuItem onClick={() => onSubmit(record)}>
                            <Send className="mr-2 h-3.5 w-3.5" /> Submit for
                            Review
                          </DropdownMenuItem>
                        )}

                        {canReviewRecord && (
                          <DropdownMenuItem onClick={() => onReview(record)}>
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Review
                          </DropdownMenuItem>
                        )}

                        {(canEditRecord ||
                          canSubmitRecord ||
                          canReviewRecord) && <DropdownMenuSeparator />}

                        {canDeleteRecord && (
                          <DropdownMenuItem
                            onClick={() => onDelete(record)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
