// app/dashboard/farms/[farmId]/poultry/components/HouseForm.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreatePoultryHouse, useUpdatePoultryHouse } from "../hooks/usePoultry";
import type { PoultryHouse } from "../types";

const houseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  houseType: z.string().min(1, "Select house type"),
  capacity: z.coerce.number().positive("Capacity must be greater than 0"),
  notes: z.string().optional(),
});

type HouseFormData = z.infer<typeof houseSchema>;

interface HouseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  editingHouse?: PoultryHouse;
  onSuccess?: () => void;
}

export function HouseForm({ open, onOpenChange, farmId, editingHouse, onSuccess }: HouseFormProps) {
  const isEditing = !!editingHouse;
  
  const createHouse = useCreatePoultryHouse(farmId);
  const updateHouse = useUpdatePoultryHouse(farmId);
  
  const isPending = isEditing ? updateHouse.isPending : createHouse.isPending;

  const form = useForm<HouseFormData>({
    resolver: zodResolver(houseSchema),
    defaultValues: {
      name: "",
      houseType: "open_sided",
      capacity: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (editingHouse && open) {
      form.reset({
        name: editingHouse.name,
        houseType: editingHouse.houseType,
        capacity: editingHouse.capacity,
        notes: editingHouse.notes || "",
      });
    }
  }, [editingHouse, open, form]);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: HouseFormData) => {
    if (isEditing && editingHouse) {
      await updateHouse.mutateAsync({ houseId: editingHouse.id, data });
    } else {
      await createHouse.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Poultry House" : "Create Poultry House"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Same fields as before */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Layer House A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="houseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select house type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open_sided">Open Sided</SelectItem>
                      <SelectItem value="closed">Closed (Controlled Environment)</SelectItem>
                      <SelectItem value="free_range">Free Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (birds)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000" {...field} />
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
                    <Textarea placeholder="Any additional information..." rows={2} {...field} />
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
                {isPending ? "Saving..." : (isEditing ? "Save Changes" : "Create House")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}