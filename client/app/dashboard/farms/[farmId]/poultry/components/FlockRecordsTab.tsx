"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFlockRecords } from "../hooks/usePoultry";
import { RecordForm } from "./RecordForm";
import { FlockRecordsTable } from "./records/FlockRecordsTable";
import { RecordDetailDialog } from "./records/RecordDetailDialog";
import { ReviewPanel } from "./records/ReviewPanel";
import { useSubmitRecord, useReviewRecord } from "../hooks/usePoultry";
import { useFarmRole } from "@/providers/FarmRoleContext";
import type { Flock, FlockRecord } from "../types";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";

interface FlockRecordsTabProps {
  flock: Flock;
  farmId: string;
}

export function FlockRecordsTab({ flock, farmId }: FlockRecordsTabProps) {
  const { role } = useFarmRole();
  const { user } = useAuth(); 
  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FlockRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<FlockRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<FlockRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<FlockRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: records, isLoading } = useFlockRecords(farmId, flock.id);
  const submitRecord = useSubmitRecord(farmId, flock.id);
  const reviewRecordMutation = useReviewRecord(farmId);

  const recordsArray = Array.isArray(records) ? records : [];

  const sortedRecords = [...recordsArray].sort(
    (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
  );

  const paginatedRecords = sortedRecords.slice(0, 50);

  const isManager = role === "manager" || role === "owner";

  const handleSubmit = (record: FlockRecord) => {
    submitRecord.mutate(record.id, {
      onSuccess: () => {
        toast.success("Record submitted for review");
      },
    });
  };

  const handleReview = (record: FlockRecord) => {
    setReviewRecord(record);
  };

  const handleReviewConfirm = (status: "reviewed" | "flagged", note?: string) => {
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
            status === "reviewed" ? "Record approved" : "Record flagged for revision"
          );
        },
      }
    );
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Records</h3>
          <p className="text-xs text-muted-foreground">
            {isManager ? "All records" : "Your records"}
          </p>
        </div>
        <Button onClick={() => setRecordFormOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Record
        </Button>
      </div>

      <FlockRecordsTable
        flock={flock}
        records={paginatedRecords}
        onView={setViewRecord}
        onEdit={setEditingRecord}
        onDelete={setDeleteRecord}
        onSubmit={handleSubmit}
        onReview={handleReview}
      />

      {/* Record Form */}
      <RecordForm
        open={recordFormOpen}
        onOpenChange={setRecordFormOpen}
        farmId={farmId}
        flockId={flock.id}
        flockType={flock.type}
        editingRecord={editingRecord || undefined}
        onSuccess={() => {
          setRecordFormOpen(false);
          setEditingRecord(null);
        }}
      />

      {/* View Dialog */}
      {viewRecord && (
        <RecordDetailDialog
          open={!!viewRecord}
          onOpenChange={() => setViewRecord(null)}
          record={viewRecord}
          onEdit={() => {
            setEditingRecord(viewRecord);
            setViewRecord(null);
          }}
        />
      )}

      {/* Review Panel */}
      {reviewRecord && (
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