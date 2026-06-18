// app/dashboard/farms/[farmId]/poultry/components/FlockRecordsTable.tsx
"use client";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

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

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Flock, FlockRecord } from "../../../types";

interface Props {
  flock: Flock;
  records: FlockRecord[];
  onView: (record: FlockRecord) => void;
  onEdit: (record: FlockRecord) => void;
  onDelete: (record: FlockRecord) => void;
}

export function FlockRecordsTable({
  flock,
  records,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const isLayers = flock.type === "layers";
  const isBroilers = flock.type === "broilers";

  // Status badge colors
  const statusStyles: Record<string, string> = {
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    submitted: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    reviewed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    flagged: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  };

  // Health risk color
  const getHealthRiskColor = (score: number) => {
    if (score >= 60) return "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400";
    if (score >= 30) return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
  };

  const handleRowClick = (record: FlockRecord) => {
    onView(record);
  };

  const handleAction = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation();
    callback();
  };

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
          {records.map((record, index) => (
            <TableRow
              key={record.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/30",
                index % 2 === 0 && "bg-muted/5"
              )}
              onClick={() => handleRowClick(record)}
            >
              <TableCell className="font-mono text-sm">
                {new Date(record.recordDate).toLocaleDateString()}
              </TableCell>

              <TableCell>
                <Badge
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    statusStyles[record.status] || statusStyles.draft
                  )}
                >
                  {record.status || "draft"}
                </Badge>
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
                <Badge
                  className={cn(
                    "text-[10px] font-mono",
                    getHealthRiskColor(record.healthRiskScore || 0)
                  )}
                >
                  {record.healthRiskScore?.toFixed(1) || "—"}
                </Badge>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {record.submittedBy?.fullName || "—"}
              </TableCell>

              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Record actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => handleAction(e as any, () => onView(record))}>
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      View Details
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      disabled={record.status !== "draft"}
                      onClick={(e) => handleAction(e as any, () => onEdit(record))}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit Record
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      disabled={record.status !== "draft"}
                      onClick={(e) => handleAction(e as any, () => onDelete(record))}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete Record
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}