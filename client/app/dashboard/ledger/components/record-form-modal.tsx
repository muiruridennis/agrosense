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
import { FarmRecord, CreateRecordInput, UpdateRecordInput } from "@/types";
import {
  recordFormSchema,
  RecordFormData,
  recordTypeOptions,
  expenseCategoryOptions,
  incomeCategoryOptions,
} from "@/lib/validations/record";

interface RecordFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: FarmRecord | null;
  onSubmit: (data: CreateRecordInput | UpdateRecordInput) => Promise<void>;
  isLoading?: boolean;
}

export function RecordFormModal({
  open,
  onOpenChange,
  record,
  onSubmit,
  isLoading = false,
}: RecordFormModalProps) {
  const isEditing = !!record;

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      recordType: "expense",
      category: "seed",
      amount: 0,
      currency: "KES",
      recordedAt: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });

  const recordType = form.watch("recordType");
  const categoryOptions =
    recordType === "income" || recordType === "harvest"
      ? incomeCategoryOptions
      : expenseCategoryOptions;

  useEffect(() => {
    if (record && open) {
      form.reset({
        recordType: record.recordType,
        category: record.category,
        amount: Number(record.amount),
        currency: record.currency,
        recordedAt: record.recordedAt.slice(0, 10),
        description: record.description ?? "",
      });
    } else if (!open) {
      form.reset();
    }
  }, [record, open, form]);

  useEffect(() => {
    const category = form.getValues("category");
    if (!categoryOptions.some((option) => option.value === category)) {
      form.setValue("category", categoryOptions[0]?.value ?? "", {
        shouldValidate: true,
      });
    }
  }, [categoryOptions, form]);

  const handleSubmit = async (data: RecordFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Record" : "New Record"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this ledger entry"
              : "Log a new income or expense record"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recordType">Record type</Label>
              <Select
                value={form.watch("recordType")}
                onValueChange={(value) =>
                  form.setValue(
                    "recordType",
                    value as RecordFormData["recordType"],
                    {
                      shouldValidate: true,
                    },
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger id="recordType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {recordTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) =>
                  form.setValue("category", value, { shouldValidate: true })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("amount", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                placeholder="KES"
                {...form.register("currency")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recordedAt">Recorded date</Label>
            <Input
              id="recordedAt"
              type="date"
              {...form.register("recordedAt")}
              disabled={isLoading}
            />
            {form.formState.errors.recordedAt && (
              <p className="text-sm text-red-500">
                {form.formState.errors.recordedAt.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the transaction"
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
              {isEditing ? "Update record" : "Save record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
