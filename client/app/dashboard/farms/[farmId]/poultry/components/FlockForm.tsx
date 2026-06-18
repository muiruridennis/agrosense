// app/dashboard/farms/[farmId]/poultry/components/FlockForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateFlock, useUpdateFlock } from "../hooks/usePoultry";
import type { Flock } from "../types";

const flockSchema = z
  .object({
    breed: z.string().min(2, "Breed is required"),
    type: z.enum(["layers", "broilers", "kienyeji", "unknown"]),
    initialCount: z.coerce
      .number()
      .positive("Initial count must be greater than 0"),
    placementDate: z.string().min(1, "Placement date is required"),
    ageAtPlacementWeeks: z.coerce.number().min(0, "Age must be 0 or greater"),
    productionStartWeek: z.coerce.number().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "layers" && !data.productionStartWeek) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Production start week is required for layers",
        path: ["productionStartWeek"],
      });
    }
  });

type FlockFormData = z.infer<typeof flockSchema>;

interface FlockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  houseName: string;
  editingFlock?: Flock; // ← If provided, we're in EDIT mode
  onSuccess?: () => void;
}

export function FlockForm({
  open,
  onOpenChange,
  houseId,
  houseName,
  editingFlock,
  onSuccess,
}: FlockFormProps) {
  const isEditing = !!editingFlock;

  const createFlock = useCreateFlock(houseId);
  const updateFlock = useUpdateFlock(editingFlock?.id || "");

  const isPending = isEditing ? updateFlock.isPending : createFlock.isPending;

  const form = useForm<FlockFormData>({
    resolver: zodResolver(flockSchema),
    defaultValues: {
      breed: "",
      type: "broilers",
      initialCount: undefined,
      placementDate: new Date().toISOString().split("T")[0],
      ageAtPlacementWeeks: 0,
      productionStartWeek: undefined,
      notes: "",
    },
  });

  const flockType = form.watch("type");

  // Populate form when editing
  useEffect(() => {
    if (editingFlock && open) {
      form.reset({
        breed: editingFlock.breed,
        type: editingFlock.type,
        initialCount: editingFlock.initialCount,
        placementDate: editingFlock.placementDate.split("T")[0],
        ageAtPlacementWeeks: editingFlock.ageAtPlacementWeeks,
        productionStartWeek: editingFlock.productionStartWeek || undefined,
        notes: editingFlock.notes || "",
      });
    }
  }, [editingFlock, open, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: FlockFormData) => {
    if (isEditing && editingFlock) {
      await updateFlock.mutateAsync(data);
    } else {
      await createFlock.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Flock" : "Add New Flock"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            House: <span className="font-medium">{houseName}</span>
          </p>
          {isEditing && (
            <p className="text-sm text-muted-foreground">
              {editingFlock.breed} · Placed{" "}
              {new Date(editingFlock.placementDate).toLocaleDateString()}
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Flock Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flock Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing} // Prevent changing type after creation
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select flock type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="broilers">Broilers (Meat)</SelectItem>
                      <SelectItem value="layers">Layers (Eggs)</SelectItem>
                      <SelectItem value="kienyeji">
                        Kienyeji (Free-range)
                      </SelectItem>
                      <SelectItem value="unknown">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  {isEditing && (
                    <FormDescription className="text-[10px]">
                      Type cannot be changed after flock creation
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Breed */}
            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Ross 308, ISA Brown, Kienyeji"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Count & Placement Date */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="initialCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000"
                        {...field}
                        disabled={isEditing}
                      />
                    </FormControl>
                    {isEditing && (
                      <FormDescription className="text-[10px]">
                        Initial count cannot be changed after creation
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placementDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placement Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isEditing} />
                    </FormControl>
                    {isEditing && (
                      <FormDescription className="text-[10px]">
                        Placement date cannot be changed
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Age at Placement & Production Start */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="ageAtPlacementWeeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age at Placement (weeks)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      0 for day-old chicks
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {flockType === "layers" && (
                <FormField
                  control={form.control}
                  name="productionStartWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Start Week</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="18" {...field} />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Week when egg production begins
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hatchery source, health status, special considerations..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Flock"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
