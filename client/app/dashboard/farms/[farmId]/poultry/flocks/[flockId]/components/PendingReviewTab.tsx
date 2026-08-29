"use client";

import { useState } from "react";
import {
  usePendingReviewRecords,
  useReviewRecord,
} from "../../../hooks/usePoultry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flock } from "@/types";
import { formatDate } from "@/utils/date";

interface PendingReviewTabProps {
  flock: Flock;
  farmId: string;
}

export function PendingReviewTab({ flock, farmId }: PendingReviewTabProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const { data, isLoading, refetch } = usePendingReviewRecords(
    farmId,
    flock.id,
  );
  const reviewRecord = useReviewRecord(farmId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.records?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
        <h4 className="text-sm font-semibold">All caught up!</h4>
        <p className="text-sm text-muted-foreground">
          No records pending review for this flock.
        </p>
      </div>
    );
  }

  const handleReview = (recordId: string, status: "reviewed" | "flagged") => {
    reviewRecord.mutate(
      {
        recordId,
        data: {
          status,
          reviewNote: status === "flagged" ? reviewNote : undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedRecordId(null);
          setReviewNote("");
          refetch();
        },
      },
    );
  };

  const toggleExpand = (recordId: string) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Pending Reviews</p>
          <p className="text-xs text-muted-foreground">
            {data.total} record{data.total !== 1 ? "s" : ""} awaiting review
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {data.total} pending
        </Badge>
      </div>

      {data.records.map((record) => {
        const isExpanded = expandedRecordId === record.id;
        const isSelected = selectedRecordId === record.id;

        return (
          <Card key={record.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">
                    {formatDate(record.recordDate, { includeYear: true })}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {record.flock?.type || "Unknown"}
                  </Badge>
                </div>
                <Badge variant="secondary" className="text-[9px]">
                  Submitted
                </Badge>
              </div>

              {/* Submitted By */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>
                  Submitted by {record.submittedBy?.fullName || "Unknown"}
                </span>
                <span className="text-xs">
                  ·{" "}
                  {new Date(
                    record.submittedAt || record.createdAt,
                  ).toLocaleDateString()}
                </span>
              </div>

              {/* Metrics Preview */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mortality:</span>
                  <span
                    className={cn(
                      "ml-1 font-medium",
                      (record.mortality || 0) > 0
                        ? "text-rose-600"
                        : "text-muted-foreground",
                    )}
                  >
                    {record.mortality || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Feed:</span>
                  <span className="ml-1 font-medium">
                    {record.feedConsumedKg || 0} kg
                  </span>
                </div>
                {record.productionRatePercent !== null && (
                  <div>
                    <span className="text-muted-foreground">Production:</span>
                    <span className="ml-1 font-medium">
                      {record.productionRatePercent}%
                    </span>
                  </div>
                )}
                {record.avgBodyWeightKg !== null && (
                  <div>
                    <span className="text-muted-foreground">Avg Weight:</span>
                    <span className="ml-1 font-medium">
                      {record.avgBodyWeightKg} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Expandable Remarks */}
              {record.remarks && (
                <div>
                  <button
                    onClick={() => toggleExpand(record.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? "Hide notes" : "Show notes"}
                  </button>
                  {isExpanded && (
                    <p className="mt-1 text-sm text-muted-foreground border-t pt-2">
                      {record.remarks}
                    </p>
                  )}
                </div>
              )}

              {/* Health Risk Score */}
              {record.healthRiskScore !== null &&
                record.healthRiskScore > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Health Risk:
                    </span>
                    <Badge
                      className={cn(
                        "text-[9px]",
                        record.healthRiskScore < 30 &&
                          "bg-emerald-100 text-emerald-700",
                        record.healthRiskScore >= 30 &&
                          record.healthRiskScore < 60 &&
                          "bg-amber-100 text-amber-700",
                        record.healthRiskScore >= 60 &&
                          "bg-rose-100 text-rose-700",
                      )}
                    >
                      {record.healthRiskScore.toFixed(1)}
                    </Badge>
                  </div>
                )}

              {/* Review Actions */}
              {isSelected ? (
                <div className="space-y-3 border-t pt-3">
                  <Textarea
                    placeholder="Add review note (required for flagging)"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleReview(record.id, "reviewed")}
                      disabled={reviewRecord.isPending}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReview(record.id, "flagged")}
                      disabled={!reviewNote || reviewRecord.isPending}
                      className="gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Flag for Revision
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRecordId(null);
                        setReviewNote("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  {!reviewNote && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Note is required when flagging a record
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRecordId(record.id)}
                    className="gap-1.5 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
