"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/utils";
import { Crop } from "@/types";
import { DataTable } from "../components/data-table";
import { RowActions } from "../components/row-actions";
import { SortableHeader } from "../components/sortable-header";
import { Badge } from "@/components/ui/badge";

interface CropsTableProps {
  crops: Crop[];
  isPending?: boolean;
  onView?: (crop: Crop) => void;
  onEdit?: (crop: Crop) => void;
  onDelete?: (cropId: string) => void;
  isDeleting?: boolean;
  toolbar?: React.ReactNode;
}

const statusColors: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  planned: "outline",
  planted: "secondary",
  growing: "secondary",
  mature: "default",
  harvested: "outline",
};

export function CropsTable({
  crops,
  isPending,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  toolbar,
}: CropsTableProps) {
  const columns: ColumnDef<Crop>[] = useMemo(
    () => [
      {
        accessorKey: "cropType",
        header: ({ column }) => (
          <SortableHeader column={column} title="Crop Type" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {row.original.cropType}
            </span>
            {row.original.variety && (
              <span className="text-xs text-muted-foreground">
                {row.original.variety}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <SortableHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge
            variant={statusColors[row.original.status] || "default"}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "currentStage",
        header: ({ column }) => (
          <SortableHeader column={column} title="Stage" />
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.currentStage || "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "plantedAt",
        header: ({ column }) => (
          <SortableHeader column={column} title="Planted" />
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.plantedAt
              ? formatDate(new Date(row.original.plantedAt))
              : "Not planted"}
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
            deleteLabel="Delete Crop"
            deleteDescription="This crop record will be permanently deleted."
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
      data={crops}
      isPending={isPending}
      searchKey="cropType"
      searchPlaceholder="Search crops by type or variety..."
      toolbar={toolbar}
      pageSize={10}
    />
  );
}
