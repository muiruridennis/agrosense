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
import { Loader2 } from "lucide-react";
import { Farm, CreateFarmInput, UpdateFarmInput } from "@/types";
import { farmFormSchema, FarmFormData } from "@/lib/validations/farm";

interface FarmFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm?: Farm | null;
  onSubmit: (data: CreateFarmInput | UpdateFarmInput) => Promise<void>;
  isLoading?: boolean;
}

export function FarmFormModal({
  open,
  onOpenChange,
  farm,
  onSubmit,
  isLoading = false,
}: FarmFormModalProps) {
  const isEditing = !!farm;

  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmFormSchema),
    defaultValues: {
      name: "",
      description: "",
      areaHectares: 0,
      country: "",
      region: "",
      subRegion: "",
      timezone: "UTC",
    },
  });

  // Populate form when farm data changes
  useEffect(() => {
    if (farm && open) {
      form.reset({
        name: farm.name,
        description: farm.description ?? "",
        areaHectares: farm.areaHectares,
        country: farm.country,
        region: farm.region,
        subRegion: farm.subRegion ?? "",
        timezone: farm.timezone,
      });
    } else if (!open) {
      form.reset();
    }
  }, [farm, open, form]);

  const handleSubmit = async (data: FarmFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Farm" : "Create Farm"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your farm details"
              : "Add a new farm to your account"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Farm Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Farm Name *</Label>
            <Input
              id="name"
              placeholder="e.g., North Field, Valley Farm"
              {...form.register("name")}
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., Primary corn and wheat production"
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

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area">Area (hectares) *</Label>
            <Input
              id="area"
              type="number"
              step="0.01"
              placeholder="e.g., 50.5"
              {...form.register("areaHectares", { valueAsNumber: true })}
              disabled={isLoading}
            />
            {form.formState.errors.areaHectares && (
              <p className="text-sm text-red-500">
                {form.formState.errors.areaHectares.message}
              </p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              placeholder="e.g., Kenya, Uganda"
              {...form.register("country")}
              disabled={isLoading}
            />
            {form.formState.errors.country && (
              <p className="text-sm text-red-500">
                {form.formState.errors.country.message}
              </p>
            )}
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region">Region/State *</Label>
            <Input
              id="region"
              placeholder="e.g., Nakuru, Western"
              {...form.register("region")}
              disabled={isLoading}
            />
            {form.formState.errors.region && (
              <p className="text-sm text-red-500">
                {form.formState.errors.region.message}
              </p>
            )}
          </div>

          {/* Sub-Region */}
          <div className="space-y-2">
            <Label htmlFor="subRegion">Sub-Region/District</Label>
            <Input
              id="subRegion"
              placeholder="e.g., Nairobi South, Kampala District (optional)"
              {...form.register("subRegion")}
              disabled={isLoading}
            />
            {form.formState.errors.subRegion && (
              <p className="text-sm text-red-500">
                {form.formState.errors.subRegion.message}
              </p>
            )}
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              placeholder="e.g., Africa/Nairobi"
              {...form.register("timezone")}
              disabled={isLoading}
            />
            {form.formState.errors.timezone && (
              <p className="text-sm text-red-500">
                {form.formState.errors.timezone.message}
              </p>
            )}
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
              {isEditing ? "Update Farm" : "Create Farm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
