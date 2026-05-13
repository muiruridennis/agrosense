"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/utils";
import { Farm } from "@/types";
import { DataTable } from "../components/data-table";
import { RowActions } from "../components/row-actions";
import { SortableHeader } from "../components/sortable-header";
import { Badge } from "@/components/ui/badge";

interface FarmsTableProps {
  farms: Farm[];
  isPending?: boolean;
  onView?: (farm: Farm) => void;
  onEdit?: (farm: Farm) => void;
  onDelete?: (farmId: string) => void;
  isDeleting?: boolean;
  toolbar?: React.ReactNode;
}

export function FarmsTable({
  farms,
  isPending,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  toolbar,
}: FarmsTableProps) {
  const columns: ColumnDef<Farm>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="font-medium text-foreground">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "region",
        header: ({ column }) => (
          <SortableHeader column={column} title="Region" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{row.original.region}</span>
            {row.original.country && (
              <span className="text-xs text-muted-foreground">
                {row.original.country}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "areaHectares",
        header: ({ column }) => (
          <SortableHeader column={column} title="Area (ha)" />
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.areaHectares.toFixed(2)} ha
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column} title="Created" />
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(new Date(row.original.createdAt))}
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
            deleteLabel="Delete Farm"
            deleteDescription="This farm and all its data will be permanently deleted."
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
      data={farms}
      isPending={isPending}
      searchKey="name"
      searchPlaceholder="Search farms by name..."
      toolbar={toolbar}
      pageSize={10}
    />
  );
}
