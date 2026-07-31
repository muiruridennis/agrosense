// app/dashboard/farms/[farmId]/settings/components/SettingsHistory.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, formatDate, formatDateTime } from "@/utils/date";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  Globe,
  Ruler,
  Phone,
  Mail,
  Building2,
  Power,
  Hash,
  Calendar,
  Lock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SettingChange {
  id: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  changedBy: {
    id: string;
    fullName: string;
    email?: string;
  };
  changedAt: string;
  reason?: string;
  context: {
    affectedRecordCount?: number;
    affectedFlocks?: number;
    requiresApproval?: boolean;
    ipAddress?: string;
    userAgent?: string;
  };
}

interface SettingsHistoryProps {
  farmId: string;
}

interface SettingsHistoryResponse {
  data: SettingChange[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CHANGE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  farmName: { label: "Farm Name", icon: Building2, color: "blue" },
  description: { label: "Description", icon: FileText, color: "gray" },
  timezone: { label: "Timezone", icon: Globe, color: "amber" },
  currency: { label: "Currency", icon: DollarSign, color: "emerald" },
  unitSystem: { label: "Unit System", icon: Ruler, color: "purple" },
  phoneNumber: { label: "Phone Number", icon: Phone, color: "blue" },
  email: { label: "Email", icon: Mail, color: "blue" },
  isActive: { label: "Farm Status", icon: Power, color: "rose" },
  contactPerson: { label: "Contact Person", icon: User, color: "gray" },
  areaHectares: { label: "Area (ha)", icon: Ruler, color: "emerald" },
  country: { label: "Country", icon: Globe, color: "blue" },
  region: { label: "Region", icon: MapPin, color: "amber" },
};

function getChangeConfig(key: string) {
  return CHANGE_TYPE_CONFIG[key] || {
    label: key.replace(/([A-Z])/g, " $1").trim(),
    icon: Hash,
    color: "gray",
  };
}

function getChangeColor(value: any): "emerald" | "rose" | "amber" | "gray" | "blue" | "purple" {
  if (typeof value === "boolean") {
    return value ? "emerald" : "rose";
  }
  if (typeof value === "string" && value.startsWith("KES")) {
    return "emerald";
  }
  if (typeof value === "string" && value.includes("Africa")) {
    return "amber";
  }
  return "gray";
}

function getChangeBadgeColor(color: string): string {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
    gray: "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400",
  };
  return colors[color] || colors.gray;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getInitials(name: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function SettingsHistory({ farmId }: SettingsHistoryProps) {
  const [page, setPage] = useState(1);
  const [selectedChange, setSelectedChange] = useState<SettingChange | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const limit = 10;

  // In a real implementation, you'd fetch this data from your API
  // For now, we'll use mock data with loading state
  const { data, isLoading } = useSettingsHistory(farmId, page, limit);

  const changes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleViewDetails = (change: SettingChange) => {
    setSelectedChange(change);
    setDetailOpen(true);
  };

  if (isLoading) {
    return <SettingsHistorySkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Changes"
          value={total}
          color="blue"
          icon={Clock}
        />
        <StatCard
          label="Last Change"
          value={changes.length > 0 ? formatRelativeTime(changes[0].changedAt) : "—"}
          color="gray"
          icon={Calendar}
        />
        <StatCard
          label="Critical Changes"
          value={changes.filter((c: SettingChange) => 
            ["currency", "timezone", "isActive"].includes(c.settingKey)
          ).length}
          color="amber"
          icon={AlertTriangle}
        />
        <StatCard
          label="Affected Records"
          value={changes.reduce((sum: number, c: SettingChange) => 
            sum + (c.context?.affectedRecordCount || 0), 0
          )}
          color="emerald"
          icon={Info}
        />
      </div>

      {/* Changes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Change History
          </CardTitle>
          <CardDescription>
            Track all configuration changes for this farm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted/20 p-4 mb-3">
                <Clock className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">No changes recorded yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Changes will appear here as you update farm settings
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Setting
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Old Value
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        New Value
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Changed By
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Time
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.map((change: SettingChange) => {
                      const config = getChangeConfig(change.settingKey);
                      const Icon = config.icon;
                      const oldColor = getChangeColor(change.oldValue);
                      const newColor = getChangeColor(change.newValue);

                      return (
                        <TableRow key={change.id} className="hover:bg-muted/10">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "rounded-full p-1.5",
                                `bg-${config.color}-50 dark:bg-${config.color}-950/20`
                              )}>
                                <Icon className={cn(
                                  "h-4 w-4",
                                  `text-${config.color}-600 dark:text-${config.color}-400`
                                )} />
                              </div>
                              <span className="font-medium">{config.label}</span>
                              {change.context?.requiresApproval && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Shield className="h-3 w-3 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Required approval</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              "font-mono text-xs",
                              getChangeBadgeColor(oldColor)
                            )}>
                              {formatValue(change.oldValue)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "font-mono text-xs",
                              getChangeBadgeColor(newColor)
                            )}>
                              {formatValue(change.newValue)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[9px] bg-muted">
                                  {getInitials(change.changedBy.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {change.changedBy.fullName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {formatRelativeTime(change.changedAt)}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{formatDateTime(change.changedAt)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => handleViewDetails(change)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3 mt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, total)} of {total} changes
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 text-sm font-medium">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Change Details
              {selectedChange?.context?.requiresApproval && (
                <Badge variant="outline" className="text-amber-500 border-amber-500">
                  Required Approval
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedChange && formatDateTime(selectedChange.changedAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              {/* Change Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Setting</p>
                  <p className="font-medium flex items-center gap-2">
                    {(() => {
                      const config = getChangeConfig(selectedChange.settingKey);
                      const Icon = config.icon;
                      return (
                        <>
                          <Icon className={cn(
                            "h-4 w-4",
                            `text-${config.color}-600 dark:text-${config.color}-400`
                          )} />
                          {config.label}
                        </>
                      );
                    })()}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Changed By</p>
                  <p className="font-medium flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px]">
                        {getInitials(selectedChange.changedBy.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChange.changedBy.fullName}
                  </p>
                </div>
              </div>

              {/* Old vs New Values */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-rose-200 dark:border-rose-800/30 p-4 bg-rose-50 dark:bg-rose-950/20">
                  <p className="text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span className="text-lg">←</span> Old Value
                  </p>
                  <p className="font-mono font-medium mt-1">
                    {formatValue(selectedChange.oldValue)}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/30 p-4 bg-emerald-50 dark:bg-emerald-950/20">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="text-lg">→</span> New Value
                  </p>
                  <p className="font-mono font-medium mt-1">
                    {formatValue(selectedChange.newValue)}
                  </p>
                </div>
              </div>

              {/* Reason */}
              {selectedChange.reason && (
                <div className="rounded-lg bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="font-medium">{selectedChange.reason}</p>
                </div>
              )}

              {/* Impact */}
              {selectedChange.context?.affectedRecordCount !== undefined && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Impact
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400/70">
                        Affected {selectedChange.context.affectedRecordCount} records
                        {selectedChange.context.affectedFlocks && 
                          ` and ${selectedChange.context.affectedFlocks} flocks`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {selectedChange.context?.ipAddress && (
                  <div>
                    <span className="font-medium">IP Address:</span> {selectedChange.context.ipAddress}
                  </div>
                )}
                {selectedChange.context?.userAgent && (
                  <div className="truncate">
                    <span className="font-medium">User Agent:</span> {selectedChange.context.userAgent}
                  </div>
                )}
                <div>
                  <span className="font-medium">Change ID:</span> {selectedChange.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK HOOK (Replace with real API call)
// ─────────────────────────────────────────────────────────────────────────────

function useSettingsHistory(farmId: string, page: number, limit: number) {
  // In a real implementation, this would call your API
  // For now, return mock data with loading state
  
  const [isLoading] = useState(false);
  
  const mockData: SettingsHistoryResponse = {
    data: [
      {
        id: "1",
        settingKey: "currency",
        oldValue: "KES",
        newValue: "USD",
        changedBy: {
          id: "user1",
          fullName: "Kamau Wamunyu",
        },
        changedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        reason: "Supplier required USD for international orders",
        context: {
          affectedRecordCount: 156,
          requiresApproval: true,
        },
      },
      {
        id: "2",
        settingKey: "timezone",
        oldValue: "Africa/Nairobi",
        newValue: "UTC",
        changedBy: {
          id: "user2",
          fullName: "Jane Muthoni",
        },
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        reason: "Team works across multiple timezones",
        context: {
          affectedRecordCount: 43,
        },
      },
      {
        id: "3",
        settingKey: "isActive",
        oldValue: true,
        newValue: false,
        changedBy: {
          id: "user1",
          fullName: "Kamau Wamunyu",
        },
        changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        reason: "Temporary shutdown for maintenance",
        context: {
          affectedRecordCount: 0,
          requiresApproval: true,
        },
      },
    ],
    total: 3,
    page,
    limit,
    pages: 1,
  };

  return { data: mockData, isLoading };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color?: "default" | "blue" | "emerald" | "amber" | "rose" | "gray" | "purple";
  icon?: React.ElementType;
}) {
  const colors = {
    default: "bg-muted/20",
    blue: "bg-blue-50 dark:bg-blue-950/20",
    emerald: "bg-emerald-50 dark:bg-emerald-950/20",
    amber: "bg-amber-50 dark:bg-amber-950/20",
    rose: "bg-rose-50 dark:bg-rose-950/20",
    gray: "bg-gray-50 dark:bg-gray-900/20",
    purple: "bg-purple-50 dark:bg-purple-950/20",
  };

  const textColors = {
    default: "text-foreground",
    blue: "text-blue-700 dark:text-blue-400",
    emerald: "text-emerald-700 dark:text-emerald-400",
    amber: "text-amber-700 dark:text-amber-400",
    rose: "text-rose-700 dark:text-rose-400",
    gray: "text-gray-700 dark:text-gray-400",
    purple: "text-purple-700 dark:text-purple-400",
  };

  return (
    <div className={cn("rounded-xl p-3 text-center", colors[color])}>
      {Icon && <Icon className={cn("h-4 w-4 mx-auto mb-1", textColors[color])} />}
      <p className={cn("text-2xl font-bold", textColors[color])}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function SettingsHistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSING IMPORTS (Add these if not already imported)
// ─────────────────────────────────────────────────────────────────────────────

import { FileText, MapPin } from "lucide-react";