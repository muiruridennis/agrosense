"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Crop, CreateCropInput, UpdateCropInput, Plot } from "@/types";
import { cropFormSchema, CropFormData } from "@/lib/validations/crop";

interface CropFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crop?: Crop | null;
  onSubmit: (data: CreateCropInput | UpdateCropInput) => Promise<void>;
  isLoading?: boolean;
  plots: Plot[];
  selectedPlotId?: string;
}

const CROP_TYPES = [
  "Maize",
  "Wheat",
  "Rice",
  "Beans",
  "Tomatoes",
  "Potatoes",
  "Cabbage",
  "Carrots",
  "Lettuce",
  "Spinach",
  "Coffee",
  "Tea",
  "Cotton",
  "Sunflower",
  "Sorghum",
  "Millet",
  "Groundnuts",
  "Soybeans",
];

const CROP_STAGES = [
  "Seed preparation",
  "Germination",
  "Seedling",
  "Vegetative growth",
  "Flowering",
  "Fruit development",
  "Maturation",
  "Ready for harvest",
];

export function CropFormModal({
  open,
  onOpenChange,
  crop,
  onSubmit,
  isLoading = false,
  plots,
  selectedPlotId,
}: CropFormModalProps) {
  const isEditing = !!crop;

  const form = useForm<CropFormData>({
    resolver: zodResolver(cropFormSchema),
    defaultValues: {
      cropType: "",
      variety: "",
      plotId: selectedPlotId || "",
      status: "planned",
      currentStage: "",
      description: "",
      estimatedYield: undefined,
      yieldUnit: "kg",
    },
  });

  // Populate form when crop data changes
  useEffect(() => {
    if (crop && open) {
      form.reset({
        cropType: crop.cropType,
        variety: crop.variety ?? "",
        plotId: crop.plotId,
        status: crop.status,
        currentStage: crop.currentStage,
        plantedAt: crop.plantedAt ? crop.plantedAt.split("T")[0] : undefined,
        expectedHarvestAt: crop.expectedHarvestAt
          ? crop.expectedHarvestAt.split("T")[0]
          : undefined,
        description: crop.description ?? "",
        estimatedYield: crop.estimatedYield ?? undefined,
        yieldUnit: crop.yieldUnit ?? "kg",
      });
    } else if (!open) {
      form.reset();
    }
  }, [crop, open, form]);

  const handleSubmit = async (data: CropFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Crop" : "Add Crop"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update crop details"
              : "Record a new crop in your farm"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Crop Type */}
          <div className="space-y-2">
            <Label htmlFor="cropType">Crop Type *</Label>
            <Select
              value={form.watch("cropType")}
              onValueChange={(value) =>
                form.setValue("cropType", value, { shouldValidate: true })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="cropType">
                <SelectValue placeholder="Select crop type" />
              </SelectTrigger>
              <SelectContent>
                {CROP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.cropType && (
              <p className="text-sm text-red-500">
                {form.formState.errors.cropType.message}
              </p>
            )}
          </div>

          {/* Variety */}
          <div className="space-y-2">
            <Label htmlFor="variety">Variety / Cultivar (optional)</Label>
            <Input
              id="variety"
              placeholder="e.g., Hybrid H123, Yellow Corn"
              {...form.register("variety")}
              disabled={isLoading}
            />
            {form.formState.errors.variety && (
              <p className="text-sm text-red-500">
                {form.formState.errors.variety.message}
              </p>
            )}
          </div>

          {/* Plot */}
          <div className="space-y-2">
            <Label htmlFor="plotId">Plot *</Label>
            <Select
              value={form.watch("plotId")}
              onValueChange={(value) =>
                form.setValue("plotId", value, { shouldValidate: true })
              }
              disabled={isLoading || plots.length === 0}
            >
              <SelectTrigger id="plotId">
                <SelectValue placeholder="Select a plot" />
              </SelectTrigger>
              <SelectContent>
                {plots.map((plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    {plot.name} ({plot.areaHectares} ha)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.plotId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.plotId.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) =>
                form.setValue(
                  "status",
                  value as
                    | "planned"
                    | "planted"
                    | "growing"
                    | "mature"
                    | "harvested",
                  { shouldValidate: true },
                )
              }
              disabled={isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="planted">Planted</SelectItem>
                <SelectItem value="growing">Growing</SelectItem>
                <SelectItem value="mature">Mature</SelectItem>
                <SelectItem value="harvested">Harvested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Stage */}
          <div className="space-y-2">
            <Label htmlFor="currentStage">Current Stage</Label>
            <Select
              value={form.watch("currentStage")}
              onValueChange={(value) =>
                form.setValue("currentStage", value, { shouldValidate: true })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="currentStage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {CROP_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Planted At */}
          <div className="space-y-2">
            <Label htmlFor="plantedAt">Planted Date</Label>
            <Input
              id="plantedAt"
              type="date"
              {...form.register("plantedAt")}
              disabled={isLoading}
            />
          </div>

          {/* Expected Harvest */}
          <div className="space-y-2">
            <Label htmlFor="expectedHarvestAt">Expected Harvest Date</Label>
            <Input
              id="expectedHarvestAt"
              type="date"
              {...form.register("expectedHarvestAt")}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about this crop"
              {...form.register("description")}
              disabled={isLoading}
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Estimated Yield */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="estimatedYield">Estimated Yield</Label>
              <Input
                id="estimatedYield"
                type="number"
                step="0.01"
                placeholder="e.g., 500"
                {...form.register("estimatedYield", { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yieldUnit">Unit</Label>
              <Select
                value={form.watch("yieldUnit")}
                onValueChange={(value) =>
                  form.setValue("yieldUnit", value, { shouldValidate: true })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="yieldUnit" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="tons">tons</SelectItem>
                  <SelectItem value="bags">bags</SelectItem>
                  <SelectItem value="bundles">bundles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Crop" : "Add Crop"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
