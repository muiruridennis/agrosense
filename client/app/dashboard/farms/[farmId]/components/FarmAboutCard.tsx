// app/dashboard/farms/[farmId]/components/FarmAboutCard.tsx
"use client";

import { FileText, MapPin, Ruler, Globe, Calendar, Users, Sprout } from "lucide-react";
import type { Farm } from "../../types";

interface FarmAboutCardProps {
  farm: Farm;
}

export function FarmAboutCard({ farm }: FarmAboutCardProps) {
  if (!farm.description) return null;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">About This Farm</h3>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {farm.description}
        </p>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium">{farm.region}, {farm.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Area</p>
              <p className="text-sm font-medium">{farm.areaHectares} hectares</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Timezone</p>
              <p className="text-sm font-medium">{farm.timezone?.replace("Africa/", "")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Active Since</p>
              <p className="text-sm font-medium">{new Date(farm.createdAt).toLocaleDateString("en-KE", { year: "numeric", month: "long" })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}