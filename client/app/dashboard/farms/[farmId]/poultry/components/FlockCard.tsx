// app/dashboard/farms/[farmId]/poultry/components/FlockCard.tsx
"use client";

import { useState } from "react";
import { ChevronRight, TrendingUp, TrendingDown, Egg, Target, Calendar, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FlockDetailsSheet } from "./FlockDetailsSheet";
import { DeleteFlockDialog } from "./DeleteFlockDialog";
import type { Flock } from "../types";
import { useRouter } from "next/navigation";

interface FlockCardProps {
  flock: Flock;
  farmId: string;
  houseName: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FlockCard({ flock, farmId, houseName, onEdit, onDelete }: FlockCardProps) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
  const expectedMortality = flock.expectedMortalityPercent || 5;
  const isMortalityHigh = mortalityRate > expectedMortality * 1.2;

  const placementDate = new Date(flock.placementDate);
  const today = new Date();
  const daysInProduction = Math.floor((today.getTime() - placementDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetDays = flock.targetDays || 42;
  const daysRemaining = Math.max(0, targetDays - daysInProduction);
  const progressPercent = Math.min(100, (daysInProduction / targetDays) * 100);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div
        className="group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
         onClick={() => router.push(`/dashboard/farms/${farmId}/poultry/flocks/${flock.id}`)}
        // onClick={() => setDetailsOpen(true)}
      >
        {/* Header with Action Buttons */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground">{flock.breed}</p>
              <Badge className="text-[9px] capitalize bg-emerald-100 text-emerald-700">
                {flock.status}
              </Badge>
              <Badge variant="outline" className="text-[9px] capitalize">
                {flock.type}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{flock.currentCount.toLocaleString()} birds</span>
              <span>•</span>
              <span>Placed: {new Date(flock.placementDate).toLocaleDateString()}</span>
              {flock.type === "broilers" && (
                <>
                  <span>•</span>
                  <span>Day {daysInProduction} / {targetDays}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Action Buttons - appear on hover */}
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* Progress Bar for Broilers */}
        {flock.type === "broilers" && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>Production Progress</span>
              <span>{daysRemaining} days remaining</span>
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>
        )}

        {/* Metrics Row */}
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {flock.type === "layers" && flock.productionStartWeek && (
            <div className="flex items-center gap-1">
              <Egg className="h-3 w-3 text-amber-500" />
              <span>Production at week {flock.productionStartWeek}</span>
            </div>
          )}
          {flock.type === "broilers" && flock.targetWeightKg && (
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-blue-500" />
              <span>Target: {flock.targetWeightKg} kg</span>
            </div>
          )}
          {flock.roiPercent > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>ROI: {flock.roiPercent.toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Mortality Alert */}
        {isMortalityHigh && flock.status === "active" && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-rose-50 p-1.5 text-[10px] text-rose-700">
            <TrendingDown className="h-3 w-3" />
            Mortality rate {mortalityRate.toFixed(1)}% exceeds target {expectedMortality}%
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteFlockDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        flock={flock}
        houseName={houseName}
        onSuccess={handleDeleteConfirm}
      />

      {/* Flock Details Sheet */}
      <FlockDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        flock={flock}
        houseName={houseName}
      />
    </>
  );
}