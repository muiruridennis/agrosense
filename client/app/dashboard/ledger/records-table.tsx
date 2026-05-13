"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate, formatCurrency } from "@/utils";
import { FarmRecord } from "@/types";
import { DataTable } from "../components/data-table";
import { RowActions } from "../components/row-actions";
import { SortableHeader } from "../components/sortable-header";
import { Badge } from "@/components/ui/badge";

interface RecordsTableProps {
  records: FarmRecord[];
  isPending?: boolean;
  onView?: (record: FarmRecord) => void;
  onEdit?: (record: FarmRecord) => void;
  onDelete?: (recordId: string) => void;
  isDeleting?: boolean;
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
  onRowClick?: (record: FarmRecord) => void;
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

export function RecordsTable({
  records,
  isPending,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  toolbar,
  emptyState,
  onRowClick,
}: RecordsTableProps) {
  const columns: ColumnDef<FarmRecord>[] = useMemo(
    () => [
      {
        accessorKey: "recordedAt",
        header: ({ column }) => <SortableHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.original.recordedAt)}
          </div>
        ),
      },
      {
        accessorKey: "recordType",
        header: ({ column }) => <SortableHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <Badge
            variant={TYPE_STYLES[row.original.recordType] || "default"}
            className="capitalize"
          >
            {row.original.recordType}
          </Badge>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <SortableHeader column={column} title="Category" />
        ),
        cell: ({ row }) => (
          <div className="text-sm capitalize text-muted-foreground">
            {row.original.category.replace(/_/g, " ")}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <SortableHeader column={column} title="Description" />
        ),
        cell: ({ row }) => (
          <div className="max-w-[240px] truncate text-sm">
            {row.original.description ?? "No description"}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <SortableHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => (
          <div
            className={
              row.original.recordType === "income" ||
              row.original.recordType === "harvest"
                ? "text-emerald-600 font-semibold"
                : "text-red-600 font-semibold"
            }
          >
            {formatCurrency(row.original.amount, row.original.currency)}
          </div>
        ),
      },
      {
        id: "actions",
        header: ({ column }) => (
          <SortableHeader column={column} title="Actions" />
        ),
        cell: ({ row }) => (
          <RowActions
            onView={() => onView?.(row.original)}
            onEdit={() => onEdit?.(row.original)}
            onDelete={() => onDelete?.(row.original.id)}
            deleteLabel="Delete record"
            deleteDescription="This entry will be permanently deleted."
            isDeleting={isDeleting}
          />
        ),
      },
    ],
    [onView, onEdit, onDelete, isDeleting],
  );

  return (
    <DataTable
      columns={columns}
      data={records}
      isPending={isPending}
      searchKey="category"
      searchPlaceholder="Search records by category..."
      toolbar={toolbar}
      emptyState={emptyState}
      pageSize={10}
      onRowClick={onRowClick}
      getRowId={(record) => record.id}
    />
  );
}
