// app/dashboard/farms/[farmId]/poultry/components/FlockActionsCard.tsx
"use client";

import { useState } from "react";
import { Plus, ClipboardList, Package, TrendingUp, FileText, Syringe, Wheat, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Flock } from "../types";
import { RecordForm } from "../../../components/RecordForm";

interface FlockActionsCardProps {
  flock: Flock;
}

export function FlockActionsCard({ flock }: FlockActionsCardProps) {
  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const isActive = flock.status === "active";

  const actions = [
    { label: "Add Daily Record", icon: Plus, onClick: () => setRecordFormOpen(true), primary: true, disabled: !isActive },
    { label: "Record Sale", icon: TrendingUp, onClick: () => {}, primary: false, disabled: !isActive },
    { label: "Record Mortality", icon: ClipboardList, onClick: () => {}, primary: false, disabled: !isActive },
    { label: "Record Feed", icon: Package, onClick: () => {}, primary: false, disabled: !isActive },
    { label: "Record Vaccination", icon: Syringe, onClick: () => {}, primary: false, disabled: !isActive },
    { label: "Close Flock", icon: XCircle, onClick: () => {}, primary: false, disabled: !isActive, variant: "destructive" as const },
  ];

  return (
    <>
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.primary ? "default" : action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="gap-1.5"
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          ))}
        </div>
        {!isActive && (
          <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
            ⚠️ This flock is closed. Actions are disabled.
          </p>
        )}
      </Card>

      <RecordForm
        open={recordFormOpen}
        onOpenChange={setRecordFormOpen}
        flockId={flock.id}
        flockType={flock.type}
        onSuccess={() => setRecordFormOpen(false)}
      />
    </>
  );
}