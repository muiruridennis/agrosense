"use client";

import { useFarms } from "@/lib/hooks/useDashboard";
import { useSelectedFarm } from "../../hooks/useSelectedFarm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function FarmSelector() {
  const { data: farms, isLoading } = useFarms();
  const { selectedFarm, setSelectedFarm } = useSelectedFarm();

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (!farms || farms.length === 0) {
    return null;
  }

  if (farms.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm">
        <span className="font-medium">{farms[0].name}</span>
      </div>
    );
  }

  return (
    <Select
      value={selectedFarm?.id}
      onValueChange={(value) => {
        const farm = farms.find((f) => f.id === value);
        if (farm) setSelectedFarm(farm);
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select farm" />
      </SelectTrigger>
      <SelectContent>
        {farms.map((farm) => (
          <SelectItem key={farm.id} value={farm.id}>
            {farm.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
