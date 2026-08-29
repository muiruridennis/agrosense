// app/dashboard/farms/[farmId]/poultry/components/FlockRecordsTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  CalendarDays,
  Activity,
  Egg,
  Wheat,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  useFlockRecords,
  useDeleteFlockRecord,
  useSubmitRecord,
  useReviewRecord,
} from "../../../hooks/usePoultry";
import { FlockRecordsChart } from "../../../components/FlockRecordsChart";
import { RecordForm } from "../../../components/RecordForm";
import { ReviewPanel } from "../../../components/records/ReviewPanel";
import { useFarmRole } from "@/providers/FarmRoleContext";
import type { Flock, FlockRecord } from "@/types";
import { RecordDetailDialog } from "../../../components/records/RecordDetailDialog";
import { FlockDetailsSheet } from "../../../components/FlockDetailsSheet";
import { DeleteRecordDialog } from "../../../components/DeleteRecordDialog";
import { FlockRecordsTable } from "../../../components/records/FlockRecordsTable";
import { useAuth } from "@/providers/auth-provider";

interface FlockRecordsTabProps {
  flock: Flock;
  farmId: string;
}

const ITEMS_PER_PAGE = 10;

export function FlockRecordsTab({ flock, farmId }: FlockRecordsTabProps) {
  const { role } = useFarmRole();
  const { user } = useAuth();
  const userId = user?.id;
  const isOwner = role === "owner";
  const isManager = role === "manager" || role === "owner";

  // Record form states
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FlockRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<FlockRecord | null>(
    null,
  );
  const [viewRecord, setViewRecord] = useState<FlockRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<FlockRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: records,
    isLoading,
    refetch,
  } = useFlockRecords(farmId, flock.id);
  const deleteMutation = useDeleteFlockRecord(farmId);
  const submitRecord = useSubmitRecord(farmId);
  const reviewRecordMutation = useReviewRecord(farmId);

  const recordsArray = Array.isArray(records) ? records : ([] as FlockRecord[]);

  const sortedRecords = [...recordsArray].sort(
    (a, b) =>
      new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime(),
  );

  const totalPages = Math.ceil(sortedRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Summary stats
  const totalRecords = recordsArray.length;
  const totalMortality = recordsArray.reduce(
    (sum, r) => sum + (r.mortality || 0),
    0,
  );
  const totalEggs = recordsArray.reduce(
    (sum, r) => sum + (r.morningEggs || 0) + (r.eveningEggs || 0),
    0,
  );
  const avgFeed =
    recordsArray.length > 0
      ? recordsArray.reduce((sum, r) => sum + (r.feedConsumedKg || 0), 0) /
        recordsArray.length
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ── Submit Handler ──

  // ── Submit Handler ──
  const handleSubmit = (record: FlockRecord) => {
    submitRecord.mutate(record.id, {
      onSuccess: () => {
        refetch();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to submit record",
        );
      },
    });
  };

  // ── Review Handler ──
  const handleReview = (record: FlockRecord) => {
    setReviewRecord(record);
  };

  const handleReviewConfirm = (
    status: "reviewed" | "flagged",
    note?: string,
  ) => {
    if (!reviewRecord) return;
    reviewRecordMutation.mutate(
      {
        recordId: reviewRecord.id,
        data: { status, reviewNote: note },
      },
      {
        onSuccess: () => {
          setReviewRecord(null);
          toast.success(
            status === "reviewed"
              ? "Record approved"
              : "Record flagged for revision",
          );
          refetch();
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to review record",
          );
        },
      },
    );
  };

  // ── Delete Handlers ──
  const handleDelete = (record: FlockRecord) => {
    if (isOwner) {
      setDeletingRecord(record);
      setDeleteDialogOpen(true);
      return;
    }

    if (record.submittedById !== userId) {
      toast.error("You can only delete your own records");
      return;
    }

    if (record.status !== "draft") {
      toast.error("Only draft records can be deleted");
      return;
    }

    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    try {
      await deleteMutation.mutateAsync(deletingRecord.id);
      setDeleteDialogOpen(false);
      setDeletingRecord(null);
      refetch();
    } catch (error) {}
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setDeletingRecord(null);
  };

  // ── Edit Handlers ──
  const handleEdit = (record: FlockRecord) => {
    if (record.status !== "draft" && record.status !== "flagged") {
      toast.error("Only draft or flagged records can be edited");
      return;
    }
    setEditingRecord(record);
    setEditFormOpen(true);
  };

  const handleViewEdit = () => {
    if (viewRecord) {
      setEditingRecord(viewRecord);
      setEditFormOpen(true);
      setViewRecord(null);
    }
  };

  const handleEditSuccess = () => {
    setEditFormOpen(false);
    setEditingRecord(null);
    refetch();
  };

  const handleFormSuccess = () => {
    setCreateFormOpen(false);
    refetch();
  };

  // ── Pagination ──
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const tableElement = document.getElementById("records-table");
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <CalendarDays className="h-5 w-5 text-primary" />
            Daily Performance Records
          </h3>
          <p className="text-sm text-muted-foreground">
            Production, mortality, feed, water and health tracking
          </p>
        </div>
        <Button
          onClick={() => setCreateFormOpen(true)}
          className="gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CalendarDays} label="Records" value={totalRecords} />
        <StatCard
          icon={ShieldAlert}
          label="Mortality"
          value={totalMortality}
          tone="destructive"
        />
        <StatCard
          icon={Egg}
          label={flock.type === "layers" ? "Eggs" : "Avg Weight"}
          value={flock.type === "layers" ? totalEggs : "-"}
          tone="warning"
        />
        <StatCard
          icon={Wheat}
          label="Avg Feed"
          value={`${avgFeed.toFixed(0)}kg`}
          tone="info"
        />
      </div>

      {/* Table */}
      <div
        id="records-table"
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Records Log
            </h4>
            <p className="text-xs text-muted-foreground">
              {sortedRecords.length} record
              {sortedRecords.length !== 1 ? "s" : ""}
              {sortedRecords.length > 0 &&
                ` · Showing page ${currentPage} of ${totalPages}`}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px] capitalize">
            {flock.type}
          </Badge>
        </div>

        <FlockRecordsTable
          flock={flock}
          records={paginatedRecords}
          onView={setViewRecord}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          onReview={handleReview}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedRecords.length)} of{" "}
              {sortedRecords.length} records
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 gap-1 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  const isCurrent = currentPage === pageNum;

                  return (
                    <Button
                      key={pageNum}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "h-8 w-8 p-0 text-xs",
                        isCurrent && "pointer-events-none",
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 gap-1 px-2"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Chart */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <FlockRecordsChart
          farmId={farmId}
          flockId={flock.id}
          type={flock.type}
          records={recordsArray}
          isLoading={isLoading}
        />
      </div>

      {/* ── Create Record Form ── */}
      <RecordForm
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        farmId={farmId}
        flockId={flock.id}
        flockType={flock.type}
        onSuccess={handleFormSuccess}
      />

      {/* ── Edit Record Form ── */}
      <RecordForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        farmId={farmId}
        flockId={flock.id}
        flockType={flock.type}
        editingRecord={editingRecord || undefined}
        onSuccess={handleEditSuccess}
      />

      {/* ── Delete Record Dialog ── */}
      <DeleteRecordDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        record={deletingRecord}
        onDeleteConfirm={handleDeleteConfirm}
        onSuccess={handleDeleteSuccess}
        isPending={deleteMutation.isPending}
      />

      {/* ── View Record Detail ── */}
      {viewRecord && (
        <RecordDetailDialog
          open={!!viewRecord}
          onOpenChange={() => setViewRecord(null)}
          record={viewRecord}
          onEdit={handleViewEdit}
          onSubmit={() => handleSubmit(viewRecord)}
          onDelete={() => handleDelete(viewRecord)}
          onReview={() => handleReview(viewRecord)}
        />
      )}

      {/* ── Review Panel (Manager only) ── */}
      {isManager && (
        <ReviewPanel
          open={!!reviewRecord}
          onOpenChange={() => setReviewRecord(null)}
          record={reviewRecord}
          onReview={handleReviewConfirm}
          isPending={reviewRecordMutation.isPending}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "default" | "destructive" | "warning" | "success" | "info";
}) {
  const toneStyles = {
    default: "bg-muted/30 text-foreground",
    destructive:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all hover:shadow-sm",
        toneStyles[tone],
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
