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
import {
  Sprout,
  Calendar,
  Leaf,
  Target,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Crop } from "@/types";
import { formatDate } from "@/utils";

interface CropDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crop: Crop | null;
  onEdit?: (crop: Crop) => void;
}

const statusColors: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  planned: "outline",
  planted: "secondary",
  growing: "secondary",
  mature: "default",
  harvested: "outline",
};

const statusIcons: Record<string, React.ElementType> = {
  planned: Leaf,
  planted: Sprout,
  growing: Leaf,
  mature: CheckCircle2,
  harvested: CheckCircle2,
};

export function CropDetailsSheet({
  open,
  onOpenChange,
  crop,
  onEdit,
}: CropDetailsSheetProps) {
  if (!crop) return null;

  const StatusIcon = statusIcons[crop.status] || Leaf;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-600" />
                {crop.cropType}
              </SheetTitle>
              <SheetDescription>
                {crop.variety || "No variety specified"}
              </SheetDescription>
            </div>
            <Badge
              variant={statusColors[crop.status] || "default"}
              className="capitalize"
            >
              {crop.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Status Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Stage
                </p>
                <p className="text-sm">
                  {crop.currentStage || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge variant={statusColors[crop.status]} className="mt-1">
                  {crop.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {crop.plantedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Planted
                  </p>
                  <p className="text-sm">
                    {formatDate(new Date(crop.plantedAt))}
                  </p>
                </div>
              )}
              {crop.expectedHarvestAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Expected Harvest
                  </p>
                  <p className="text-sm">
                    {formatDate(new Date(crop.expectedHarvestAt))}
                  </p>
                </div>
              )}
              {crop.harvestedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Harvested
                  </p>
                  <p className="text-sm">
                    {formatDate(new Date(crop.harvestedAt))}
                  </p>
                </div>
              )}
              {!crop.plantedAt && !crop.expectedHarvestAt && (
                <p className="text-sm text-muted-foreground">
                  No timeline data
                </p>
              )}
            </CardContent>
          </Card>

          {/* Yield Card */}
          {crop.estimatedYield && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Yield</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Estimated Yield
                  </p>
                  <p className="text-sm">
                    {crop.estimatedYield} {crop.yieldUnit || "kg"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {crop.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {crop.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm">
                  {formatDate(new Date(crop.createdAt))}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p className="text-sm">
                  {formatDate(new Date(crop.updatedAt))}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Edit Button */}
          {onEdit && (
            <Button
              onClick={() => onEdit(crop)}
              className="w-full"
              variant="outline"
            >
              Edit Crop
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
