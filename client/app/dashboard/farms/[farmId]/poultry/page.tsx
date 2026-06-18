// app/dashboard/farms/[farmId]/poultry/page.tsx
"use client";

import { useParams } from "next/navigation";
import { PoultryHousesGrid } from "./components/PoultryHousesGrid";

export default function PoultryPage() {
  const { farmId } = useParams<{ farmId: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Poultry Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage houses, flocks, and production records
        </p>
      </div>

      <PoultryHousesGrid farmId={farmId} />
    </div>
  );
}