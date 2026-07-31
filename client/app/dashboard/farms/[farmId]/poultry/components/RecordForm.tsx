// app/dashboard/farms/[farmId]/poultry/components/RecordForm.tsx
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSubmitFlockRecord, useUpdateFlockRecord } from "../hooks/usePoultry";
import type { FlockRecord } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA — with conditional validation based on flock type
// ─────────────────────────────────────────────────────────────────────────────

const baseSchema = z.object({
  recordDate: z.string().min(1, "Date is required"),
  mortality: z.coerce.number().min(0, "Mortality cannot be negative").default(0),
  culls: z.coerce.number().min(0, "Culls cannot be negative").default(0),
  feedConsumedKg: z.coerce.number().min(0, "Feed consumption cannot be negative").default(0),
  waterConsumedLitres: z.coerce.number().min(0, "Water consumption cannot be negative").optional(),
  sickBirds: z.coerce.number().min(0, "Sick birds cannot be negative").default(0),
  morningEggs: z.coerce.number().min(0, "Morning eggs cannot be negative").optional(),
  eveningEggs: z.coerce.number().min(0, "Evening eggs cannot be negative").optional(),
  brokenEggs: z.coerce.number().min(0, "Broken eggs cannot be negative").default(0),
  dirtyEggs: z.coerce.number().min(0, "Dirty eggs cannot be negative").default(0),
  avgBodyWeightKg: z.coerce.number().min(0, "Weight cannot be negative").optional(),
  remarks: z.string().optional(),
});

// ✅ Conditional validation based on flock type
const getRecordSchema = (flockType: "layers" | "broilers") => {
  if (flockType === "layers") {
    return baseSchema.superRefine((data, ctx) => {
      // Layers: at least one of morningEggs or eveningEggs is required
      if (!data.morningEggs && !data.eveningEggs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least morning or evening eggs is required",
          path: ["morningEggs"],
        });
      }
    });
  }

  if (flockType === "broilers") {
    return baseSchema.superRefine((data, ctx) => {
      // Broilers: avgBodyWeightKg is required
      if (!data.avgBodyWeightKg) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Average weight is required for broilers",
          path: ["avgBodyWeightKg"],
        });
      }
    });
  }

  return baseSchema;
};

type RecordFormData = z.infer<typeof baseSchema>;

interface RecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  flockId: string;
  flockType: "layers" | "broilers";
  editingRecord?: FlockRecord;
  onSuccess?: () => void;
}

export function RecordForm({
  open,
  onOpenChange,
  farmId,
  flockId,
  flockType,
  editingRecord,
  onSuccess,
}: RecordFormProps) {
  const isEditing = !!editingRecord;

  const createRecord = useSubmitFlockRecord(farmId, flockId);
  const updateRecord = useUpdateFlockRecord(
    farmId,
    editingRecord?.id || ""
  );

  const isPending = isEditing ? updateRecord.isPending : createRecord.isPending;

  // ✅ Use the conditional schema based on flock type
  const form = useForm<RecordFormData>({
    resolver: zodResolver(getRecordSchema(flockType)),
    defaultValues: {
      recordDate: new Date().toISOString().split("T")[0],
      mortality: 0,
      culls: 0,
      feedConsumedKg: undefined,
      waterConsumedLitres: undefined,
      sickBirds: 0,
      morningEggs: undefined,
      eveningEggs: undefined,
      brokenEggs: 0,
      dirtyEggs: 0,
      avgBodyWeightKg: undefined,
      remarks: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingRecord && open) {
      form.reset({
        recordDate: editingRecord.recordDate.split("T")[0],
        mortality: editingRecord.mortality || 0,
        culls: editingRecord.culls || 0,
        feedConsumedKg: editingRecord.feedConsumedKg || undefined,
        waterConsumedLitres: editingRecord.waterConsumedLitres || undefined,
        sickBirds: editingRecord.sickBirds || 0,
        morningEggs: editingRecord.morningEggs || undefined,
        eveningEggs: editingRecord.eveningEggs || undefined,
        brokenEggs: editingRecord.brokenEggs || 0,
        dirtyEggs: editingRecord.dirtyEggs || 0,
        avgBodyWeightKg: editingRecord.avgBodyWeightKg || undefined,
        remarks: editingRecord.remarks || "",
      });
    }
  }, [editingRecord, open, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: RecordFormData) => {
    if (isEditing && editingRecord) {
      await updateRecord.mutateAsync({ recordId: editingRecord.id, data });
    } else {
      await createRecord.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
    onSuccess?.();
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Daily Record" : "Add Daily Record"}</DialogTitle>
          {isEditing && (
            <p className="text-sm text-muted-foreground">
              Record for {new Date(editingRecord.recordDate).toLocaleDateString()}
            </p>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Date - Always Required */}
            <FormField
              control={form.control}
              name="recordDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="mortality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mortality (# birds)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedConsumedKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed Consumed (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="sickBirds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sick Birds</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waterConsumedLitres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water Consumed (L)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Layers Section ── */}
            {flockType === "layers" && (
              <>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="mb-2 text-xs font-medium text-primary">Egg Production</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="morningEggs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Morning Eggs</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="eveningEggs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Evening Eggs</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="brokenEggs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Broken Eggs</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dirtyEggs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirty Eggs</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <p className="mt-2 text-[10px] text-muted-foreground">
                    <span className="text-destructive">*</span> At least morning or evening eggs is required
                  </p>
                </div>
              </>
            )}

            {/* ── Broilers Section ── */}
            {flockType === "broilers" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="mb-2 text-xs font-medium text-primary">Broiler Metrics</p>
                <FormField
                  control={form.control}
                  name="avgBodyWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average Weight (kg) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ── Notes ── */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Health observations, issues, etc." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : (isEditing ? "Save Changes" : "Save Record")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}