"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Tag, MapPin } from "lucide-react";
import { FarmRecord } from "@/types";
import { formatDate, formatCurrency } from "@/utils";

interface RecordDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FarmRecord | null;
  onEdit?: (record: FarmRecord) => void;
}

const TYPE_STYLES: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  expense: "destructive",
  income: "secondary",
  treatment: "default",
  feed: "default",
  harvest: "secondary",
  labor: "outline",
  equipment: "outline",
};

export function RecordDetailsSheet({
  open,
  onOpenChange,
  record,
  onEdit,
}: RecordDetailsSheetProps) {
  if (!record) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{record.category.replace(/_/g, " ")}</SheetTitle>
          <SheetDescription>Ledger record details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Type</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Record type</p>
                <Badge
                  variant={TYPE_STYLES[record.recordType] || "default"}
                  className="capitalize"
                >
                  {record.recordType}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(record.amount, record.currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-sm capitalize">
                  {record.category.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm">{formatDate(record.recordedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm text-foreground">
                  {record.description ?? "No description provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Audit</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(record.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-sm">{formatDate(record.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {onEdit && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => onEdit(record)}
            >
              Edit record
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
