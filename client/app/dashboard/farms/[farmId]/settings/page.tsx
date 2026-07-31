// app/dashboard/farms/[farmId]/settings/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useFarmRole } from "@/providers/FarmRoleContext"; // contexts/FarmRoleContext";
import { useSettingsPermissions, SettingAccessLevel } from "./hooks/useSettingsPermissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { 
  Shield, 
  AlertCircle, 
  Clock, 
  User, 
  Settings as SettingsIcon,
  Lock,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsGuard } from "./components/SettingsGuard";
import { SettingsHistory } from "./components/SettingsHistory";
import { useFarm, useUpdateFarm } from "../../hooks/useFarms";

const generalSchema = z.object({
  name: z.string().min(2, "Farm name must be at least 2 characters"),
  description: z.string().optional(),
  timezone: z.string().min(1, "Please select a timezone"),
  currency: z.string().min(1, "Please select a currency"),
  unitSystem: z.enum(["metric", "imperial"]),
  isActive: z.boolean().default(true),
});

type GeneralFormData = z.infer<typeof generalSchema>;

export default function SettingsPage() {
  const { farmId } = useParams();
  const { data: farm, isLoading } = useFarm(farmId as string);
  const updateFarm = useUpdateFarm(farmId as string);
  
  // Role-based permissions
  const { 
    role, 
    isOwner, 
    isManager, 
    isWorker,
    canViewFinancials,
    canManageTeam 
  } = useFarmRole();
  
  const { 
    checkPermission,
    canManageGeneralSettings,
    canManageOperationalSettings,
  } = useSettingsPermissions(farmId as string);

  const [guardOpen, setGuardOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ field: string; value: any; reason?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const form = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: farm?.name || "",
      description: farm?.description || "",
      timezone: farm?.timezone || "Africa/Nairobi",
      currency: farm?.currency || "KES",
      unitSystem: farm?.unitSystem || "metric",
      isActive: farm?.isActive !== undefined ? farm.isActive : true,
    },
  });

  // Update form when farm data loads
  useEffect(() => {
    if (farm) {
      form.reset({
        name: farm.name,
        description: farm.description || "",
        timezone: farm.timezone || "Africa/Nairobi",
        currency: farm.currency || "KES",
        unitSystem: farm.unitSystem || "metric",
        isActive: farm.isActive !== undefined ? farm.isActive : true,
      });
    }
  }, [farm, form]);

  // ── Field Change Handler with Permission Check ──
  const handleFieldChange = async (field: keyof GeneralFormData, value: any) => {
    // Determine permission level for the field
    let accessLevel = SettingAccessLevel.MANAGER_OR_OWNER;
    
    if (field === 'currency' || field === 'isActive') {
      accessLevel = SettingAccessLevel.OWNER_ONLY;
    } else if (field === 'timezone' || field === 'unitSystem') {
      accessLevel = SettingAccessLevel.MANAGER_OR_OWNER;
    } else {
      accessLevel = SettingAccessLevel.MANAGER_OR_OWNER;
    }

    const permission = checkPermission(accessLevel);

    if (!permission.canEdit) {
      toast.error(`You don't have permission to change ${field}`);
      return;
    }

    // For critical fields, show guard dialog
    if (field === 'currency' || field === 'isActive') {
      setPendingChange({ field, value });
      setGuardOpen(true);
      return;
    }

    // Apply change directly
    await applyChange(field, value);
  };

  const applyChange = async (field: string, value: any, reason?: string) => {
    try {
      await updateFarm.mutateAsync({ [field]: value, changeReason: reason });
      toast.success(`${field} updated successfully`);
      form.setValue(field as any, value);
    } catch (error: any) {
      toast.error(error?.message || `Failed to update ${field}`);
    }
  };

  const onSubmit = async (data: GeneralFormData) => {
    // Check which fields changed
    const changes: Partial<GeneralFormData> = {};
    let hasCriticalChange = false;

    Object.keys(data).forEach((key) => {
      const field = key as keyof GeneralFormData;
      if (data[field] !== form.formState.defaultValues?.[field]) {
        changes[field] = data[field];
        if (field === 'currency' || field === 'isActive') {
          hasCriticalChange = true;
        }
      }
    });

    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save");
      return;
    }

    // If there's a critical change, show guard
    if (hasCriticalChange) {
      // Handle through individual field changes
      // Or batch them with a reason
      return;
    }

    // Apply all non-critical changes
    try {
      await updateFarm.mutateAsync({ ...changes, changeReason: "Updated general settings" });
      toast.success("Settings updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update settings");
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            {role}
          </Badge>
          {isOwner && (
            <Badge variant="default" className="gap-1 bg-amber-500">
              <Shield className="h-3 w-3" />
              Owner
            </Badge>
          )}
          {isManager && (
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Manager
            </Badge>
          )}
          {isWorker && (
            <Badge variant="outline" className="gap-1">
              Worker
            </Badge>
          )}
        </div>
        {!isOwner && !isManager && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Eye className="h-3 w-3" />
            Read Only
          </Badge>
        )}
      </div>

      {/* Permission Warnings */}
      {!canManageGeneralSettings && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Limited Access
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400/70">
                You have {role} permissions. Some settings may be locked.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
              <TabsTrigger value="general" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="operational" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                Operational
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Clock className="h-4 w-4" />
                History
              </TabsTrigger>
              {(isOwner || canManageTeam) && (
                <TabsTrigger value="team" className="gap-2">
                  <User className="h-4 w-4" />
                  Team
                </TabsTrigger>
              )}
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>
                    Basic information about your farm
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Green Acres Farm" 
                            {...field}
                            disabled={!canManageGeneralSettings}
                          />
                        </FormControl>
                        <FormDescription>
                          This name will appear throughout the app
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of your farm..."
                            className="min-h-[100px]"
                            {...field}
                            disabled={!canManageGeneralSettings}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <FormDescription>
                            Enable or disable this farm
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              if (isOwner) {
                                field.onChange(checked);
                                handleFieldChange('isActive', checked);
                              } else {
                                toast.error("Only the farm owner can change status");
                              }
                            }}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Operational Tab */}
            <TabsContent value="operational" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Operational Settings
                    <Badge variant="outline" className="text-xs">
                      {canManageOperationalSettings ? 'Editable' : 'Locked'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    These settings affect all farm operations and financial calculations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleFieldChange('timezone', value);
                            }}
                            defaultValue={field.value}
                            disabled={!canManageOperationalSettings}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Africa/Nairobi">
                                Africa/Nairobi (EAT)
                              </SelectItem>
                              <SelectItem value="Africa/Johannesburg">
                                Africa/Johannesburg (SAST)
                              </SelectItem>
                              <SelectItem value="Africa/Cairo">
                                Africa/Cairo (EET)
                              </SelectItem>
                              <SelectItem value="Africa/Lagos">
                                Africa/Lagos (WAT)
                              </SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Used for all date/time displays
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleFieldChange('currency', value);
                            }}
                            defaultValue={field.value}
                            disabled={!isOwner}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                              <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                              <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                              <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Currency for all financial calculations
                          </FormDescription>
                          {!isOwner && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Only the farm owner can change currency
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="unitSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit System</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleFieldChange('unitSystem', value);
                          }}
                          defaultValue={field.value}
                          disabled={!canManageOperationalSettings}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit system" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="metric">Metric (kg, L, °C)</SelectItem>
                            <SelectItem value="imperial">Imperial (lb, gal, °F)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Units used for measurements throughout the app
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              <SettingsHistory farmId={farmId as string} />
            </TabsContent>

            {/* Team Tab - Only for Owner/Manager */}
            {(isOwner || canManageTeam) && (
              <TabsContent value="team" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Team Management
                      <Badge variant="outline" className="text-xs">
                        {isOwner ? 'Full Access' : 'Limited'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Manage who has access to this farm
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Team management is available in the Team tab.
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {isOwner 
                        ? 'You can add, remove, and change member roles.' 
                        : 'You can view team members but cannot make changes.'}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Save Button - Only show if user can edit */}
          {(canManageGeneralSettings || canManageOperationalSettings) && (
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={updateFarm.isPending || !form.formState.isDirty}
              >
                {updateFarm.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </form>
      </Form>

      {/* Danger Zone - Only Owner */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for this farm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-destructive/20 p-4">
              <div>
                <p className="font-medium">Delete Farm</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this farm and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                className="mt-2 sm:mt-0"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this farm? This action cannot be undone.")) {
                    toast.error("Farm deletion is not yet implemented");
                  }
                }}
              >
                Delete Farm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Guard Dialog */}
      <SettingsGuard
        open={guardOpen}
        onOpenChange={setGuardOpen}
        onConfirm={(reason) => {
          if (pendingChange) {
            applyChange(pendingChange.field, pendingChange.value, reason);
            setPendingChange(null);
            setGuardOpen(false);
          }
        }}
        title="Confirm Critical Change"
        description={`You are about to change ${pendingChange?.field}`}
        warning={`Changing ${pendingChange?.field} will affect all farm operations and historical data`}
        impact={{
          affectedRecords: 0,
          affectedFlocks: 0,
          needsConfirmation: true,
        }}
        isDestructive={pendingChange?.field === 'isActive' && pendingChange?.value === false}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-32 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}