// app/dashboard/farms/[farmId]/settings/pricing/components/CreatePricingDialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { useCreatePricingTier } from "../../hooks/usePricing";
import { PricingTier } from "@/types";

const pricingSchema = z.object({
  feedCostPerKg: z.coerce
    .number()
    .positive("Feed price must be greater than 0"),
  eggPricePerTray: z.coerce
    .number()
    .positive("Egg price must be greater than 0"),
  broilerPricePerKg: z.coerce
    .number()
    .positive("Broiler price must be greater than 0"),
  mortalityCostPerBird: z.coerce
    .number()
    .positive("Mortality cost must be greater than 0"),
  dayOldChickWeightKg: z.coerce
    .number()
    .positive("Day-old chick weight must be greater than 0")
    .optional(),
  reason: z.string().min(5, "Please provide a reason for this pricing change"),
  notes: z.string().optional(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

interface CreatePricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  currentPricing?: PricingTier;
}

export function CreatePricingDialog({
  open,
  onOpenChange,
  farmId,
  currentPricing,
}: CreatePricingDialogProps) {
  const createPricing = useCreatePricingTier(farmId);

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      feedCostPerKg: currentPricing?.feedCostPerKg || 35,
      eggPricePerTray: currentPricing?.eggPricePerTray || 390,
      broilerPricePerKg: currentPricing?.broilerPricePerKg || 250,
      mortalityCostPerBird: currentPricing?.mortalityCostPerBird || 800,
      dayOldChickWeightKg: currentPricing?.dayOldChickWeightKg || 0.04,
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (data: PricingFormData) => {
    await createPricing.mutateAsync(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentPricing
              ? "Create New Pricing Version"
              : "Set Up Farm Pricing"}
          </DialogTitle>
          <DialogDescription>
            {currentPricing
              ? "This will create a new draft pricing tier. You can activate it later."
              : "Configure your farm's economic assumptions for financial calculations."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="feedCostPerKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed Price (KES/kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eggPricePerTray"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Egg Price (KES/tray)</FormLabel>
                    <FormControl>
                      <Input type="number" step="5" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      1 tray = 30 eggs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="broilerPricePerKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broiler Price (KES/kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mortalityCostPerBird"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mortality Cost (KES/bird)</FormLabel>
                    <FormControl>
                      <Input type="number" step="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change Reason *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Supplier price increase"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional context..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPricing.isPending}>
                {createPricing.isPending ? "Creating..." : "Create Pricing"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
