// app/dashboard/farms/[farmId]/poultry/components/PoultryHouseCard.tsx
"use client";

import { useState } from "react";
import { Home, ChevronRight, Plus, Users, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FlockCard } from "./FlockCard";
import { FlockForm } from "./FlockForm";
import { DeleteFlockDialog } from "./DeleteFlockDialog";
import type { PoultryHouse, Flock } from "../types";

interface PoultryHouseCardProps {
  house: PoultryHouse;
  farmId: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PoultryHouseCard({ house, farmId, onEdit, onDelete }: PoultryHouseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [createFlockOpen, setCreateFlockOpen] = useState(false);
  const [editingFlock, setEditingFlock] = useState<Flock | null>(null);
  const [deletingFlock, setDeletingFlock] = useState<Flock | null>(null);

  const activeFlocks = house.flocks?.filter(f => f.status === "active") || [];
  const occupancyRate = (activeFlocks.reduce((sum, f) => sum + f.currentCount, 0) / house.capacity) * 100;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg",
        !house.isActive && "opacity-60"
      )}
    >
      {/* Header gradient */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{house.name}</h3>
                <Badge variant={house.isActive ? "default" : "secondary"} className="text-[10px]">
                  {house.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {house.houseType?.replace("_", " ")} · {house.capacity.toLocaleString()} birds capacity
              </p>
            </div>
          </div>
          
          {/* House Action Buttons */}
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0"
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Occupancy Bar */}
      <div className="px-4 pt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Occupancy</span>
          <span>{Math.round(occupancyRate)}%</span>
        </div>
        <Progress value={occupancyRate} className="h-1.5" />
      </div>

      {/* Flocks Summary */}
      <div className="p-4 space-y-3">
        {activeFlocks.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Active Flocks ({activeFlocks.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateFlockOpen(true)}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add Flock
              </Button>
            </div>

            {expanded ? (
              <div className="space-y-2">
                {house.flocks?.map((flock) => (
                  <FlockCard 
                    key={flock.id} 
                    flock={flock} 
                    farmId={farmId}
                    houseName={house.name}
                    onEdit={() => setEditingFlock(flock)}
                    onDelete={() => setDeletingFlock(flock)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeFlocks.slice(0, 2).map((flock) => (
                  <div key={flock.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-2">
                    <div>
                      <p className="text-sm font-medium">{flock.breed}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {flock.type} · {flock.currentCount} birds
                      </p>
                    </div>
                    <Badge className="text-[9px] capitalize bg-emerald-100 text-emerald-700">
                      {flock.status}
                    </Badge>
                  </div>
                ))}
                {activeFlocks.length > 2 && (
                  <p className="text-center text-xs text-muted-foreground pt-1">
                    + {activeFlocks.length - 2} more flocks
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-4 text-center">
            <Users className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No active flocks</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateFlockOpen(true)}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="h-3 w-3" />
              Add First Flock
            </Button>
          </div>
        )}
      </div>

      {/* Notes */}
      {house.notes && (
        <div className="border-t px-4 py-2.5">
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {house.notes}
          </p>
        </div>
      )}

      {/* Create Flock Dialog */}
      <FlockForm
        open={createFlockOpen}
        onOpenChange={setCreateFlockOpen}
        houseId={house.id}
        houseName={house.name}
        onSuccess={() => setExpanded(true)}
      />

      {/* Edit Flock Dialog */}
      <FlockForm
        open={!!editingFlock}
        onOpenChange={() => setEditingFlock(null)}
        houseId={house.id}
        houseName={house.name}
        editingFlock={editingFlock || undefined}
        onSuccess={() => {
          setExpanded(true);
          setEditingFlock(null);
        }}
      />

      {/* Delete Flock Dialog */}
      <DeleteFlockDialog
        open={!!deletingFlock}
        onOpenChange={() => setDeletingFlock(null)}
        flock={deletingFlock!}
        houseName={house.name}
        onSuccess={() => {
          setDeletingFlock(null);
        }}
      />
    </Card>
  );
}