"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Ruler, Globe } from "lucide-react";
import { Farm } from "@/types";
import { formatDate } from "@/utils";

interface FarmDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm: Farm | null;
  onEdit?: (farm: Farm) => void;
}

export function FarmDetailsSheet({
  open,
  onOpenChange,
  farm,
  onEdit,
}: FarmDetailsSheetProps) {
  if (!farm) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{farm.name}</SheetTitle>
          <SheetDescription>Farm details and information</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Location Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Location</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Country
                </p>
                <p className="text-sm">{farm.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Region
                </p>
                <p className="text-sm">{farm.region}</p>
              </div>
              {farm.subRegion && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sub-Region
                  </p>
                  <p className="text-sm">{farm.subRegion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Area */}
              <div className="flex items-start gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Area
                  </p>
                  <p className="text-sm">
                    {farm.areaHectares.toFixed(2)} hectares
                  </p>
                </div>
              </div>

              {/* Timezone */}
              {farm.timezone && (
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Timezone
                    </p>
                    <p className="text-sm">{farm.timezone}</p>
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm">
                    {formatDate(new Date(farm.createdAt))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {farm.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {farm.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Plots Summary */}
          {farm.plots && farm.plots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Plots ({farm.plots.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {farm.plots.slice(0, 5).map((plot: any) => (
                    <div
                      key={plot.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{plot.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {plot.areaHectares} ha
                      </Badge>
                    </div>
                  ))}
                  {farm.plots.length > 5 && (
                    <p className="text-xs text-muted-foreground pt-2">
                      +{farm.plots.length - 5} more plots
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Button */}
          {onEdit && (
            <Button
              onClick={() => onEdit(farm)}
              className="w-full"
              variant="outline"
            >
              Edit Farm
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
