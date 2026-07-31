// app/dashboard/farms/[farmId]/settings/components/SettingsGuard.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Shield, Info, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsGuardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void | Promise<void>;
  title: string;
  description: string;
  warning: string;
  impact?: {
    affectedRecords?: number;
    affectedFlocks?: number;
    affectedUsers?: number;
    needsConfirmation: boolean;
  };
  isDestructive?: boolean;
  requiresReason?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function SettingsGuard({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  warning,
  impact,
  isDestructive = false,
  requiresReason = true,
  confirmLabel = "Confirm Change",
  cancelLabel = "Cancel",
}: SettingsGuardProps) {
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (step === "warning") {
      // If destructive, go to confirmation step
      if (isDestructive) {
        setStep("confirm");
        return;
      }
      
      // Otherwise, proceed with reason check
      if (requiresReason && !reason.trim()) {
        return;
      }
      
      await submitChange();
      return;
    }

    // Confirmation step - check if user typed CONFIRM
    if (isDestructive && confirmation !== "CONFIRM") {
      return;
    }

    await submitChange();
  };

  const submitChange = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      resetState();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the parent
      console.error("Failed to confirm change:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setReason("");
    setConfirmation("");
    setStep("warning");
  };

  const handleCancel = () => {
    resetState();
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const getIconColor = () => {
    if (isDestructive) return "text-destructive";
    return "text-amber-500";
  };

  const getBorderColor = () => {
    if (isDestructive) return "border-destructive/50 bg-destructive/10";
    return "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20";
  };

  const getTextColor = () => {
    if (isDestructive) return "text-destructive";
    return "text-amber-700 dark:text-amber-400";
  };

  const getTitleColor = () => {
    if (isDestructive) return "text-destructive";
    return "text-amber-600";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", getTitleColor())}>
            <Shield className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === "warning" ? (
          <div className="space-y-4">
            {/* Warning Box */}
            <div className={cn("rounded-lg border p-4", getBorderColor())}>
              <div className="flex items-start gap-3">
                {isDestructive ? (
                  <AlertCircle className={cn("h-5 w-5 mt-0.5", getIconColor())} />
                ) : (
                  <AlertTriangle className={cn("h-5 w-5 mt-0.5", getIconColor())} />
                )}
                <div>
                  <p className={cn("font-medium", getTextColor())}>{warning}</p>
                  {impact && (
                    <div className="mt-2 space-y-1">
                      {impact.affectedRecords !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          📊 Affects {impact.affectedRecords} records
                        </p>
                      )}
                      {impact.affectedFlocks !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          🐔 Affects {impact.affectedFlocks} flocks
                        </p>
                      )}
                      {impact.affectedUsers !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          👥 Affects {impact.affectedUsers} team members
                        </p>
                      )}
                      {impact.needsConfirmation && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          This action requires confirmation
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reason Input */}
            {requiresReason && (
              <div>
                <Label htmlFor="reason" className="text-sm font-medium">
                  Reason for this change <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Why are you making this change? (e.g., Supplier feedback, Market adjustment, System requirement)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This reason will be logged in the audit trail
                </p>
              </div>
            )}

            {/* Impact Preview */}
            {isDestructive && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  This action is irreversible and cannot be undone
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCancel}>
                {cancelLabel}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={requiresReason && !reason.trim()}
                variant={isDestructive ? "destructive" : "default"}
                className={cn(
                  isDestructive && "hover:bg-destructive/90"
                )}
              >
                {isDestructive ? "Continue to Confirmation" : confirmLabel}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Confirmation Step (for destructive actions)
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">
                    This action is permanent and cannot be undone
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Type <span className="font-mono font-bold text-destructive">CONFIRM</span> to proceed with this destructive action
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Type CONFIRM to proceed
              </Label>
              <Input
                id="confirmation"
                placeholder="Type CONFIRM here"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                className="mt-1 font-mono"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirmation !== "CONFIRM" || isSubmitting}
                variant="destructive"
              >
                {isSubmitting ? "Processing..." : "Confirm Destructive Action"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}