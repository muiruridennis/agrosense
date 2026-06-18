// app/dashboard/farms/[farmId]/poultry/components/FlockHeader.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Flock } from "../types";

interface FlockHeaderProps {
  flock: Flock;
  farmId: string;
}

export function FlockHeader({ flock, farmId }: FlockHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/farms/${farmId}/poultry`)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Houses
        </Button>

        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              {flock.breed}
            </h1>
            <Badge className={cn(
              "text-[10px] capitalize",
              flock.status === "active" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              flock.status === "closed" && "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400",
            )}>
              {flock.status}
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">
              {flock.currentStage?.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {flock.type.charAt(0).toUpperCase() + flock.type.slice(1)} · Placed {new Date(flock.placementDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <MoreVertical className="h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/dashboard/farms/${farmId}/poultry/flocks/${flock.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Flock
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Flock
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}