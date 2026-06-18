// app/dashboard/farms/[farmId]/components/FarmOverview.tsx
"use client";

import { MapPin, Calendar, FileText, Globe, Ruler } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardIntegratedData } from "@/lib/hooks/useIntegratedDashboard";
import type { Farm } from "../../../types";

interface FarmOverviewProps {
  farm: Farm;
  dashboard: DashboardIntegratedData;
}

export function FarmOverview({ farm, dashboard }: FarmOverviewProps) {
  return (
    <div className="space-y-5">
      {/* Description Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            About this farm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {farm.description || "No description provided."}
          </p>
        </CardContent>
      </Card>

      {/* Location Card - if coordinates exist */}
      {farm.location && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full rounded-lg bg-muted/30 border overflow-hidden">
              {/* Map placeholder - integrate with map library later */}
              <div className="flex h-full items-center justify-center bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  📍 {farm.location.latitude}, {farm.location.longitude}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {farm.timezone || "Africa/Nairobi"}
              </span>
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {farm.areaHectares} hectares
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {new Date(farm.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Enterprises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Poultry</p>
              <p className="text-lg font-semibold">{dashboard.poultry?.activeFlocks || 0} flocks</p>
              <p className="text-xs text-muted-foreground">{dashboard.poultry?.totalBirds || 0} birds</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Dairy</p>
              <p className="text-lg font-semibold">{dashboard.dairy?.activeHerds || 0} cows</p>
              <p className="text-xs text-muted-foreground">{dashboard.dairy?.dailyMilkYield || 0} L/day</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Crops</p>
              <p className="text-lg font-semibold">{dashboard.crops?.activeCycles || 0} cycles</p>
              <p className="text-xs text-muted-foreground">{dashboard.crops?.plantedHectares || 0} ha</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Inventory</p>
              <p className="text-lg font-semibold">{dashboard.inventoryOps?.totalItems || 0} items</p>
              <p className="text-xs text-muted-foreground">{dashboard.inventoryOps?.lowStock || 0} low stock</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}