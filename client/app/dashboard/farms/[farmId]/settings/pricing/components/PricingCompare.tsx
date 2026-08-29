// app/dashboard/farms/[farmId]/settings/pricing/components/PricingCompare.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Egg,
  Weight,
  AlertCircle,
  Droplet,
  Zap,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date";
import { PricingTier } from "@/types";

interface PricingCompareProps {
  tiers: PricingTier[];
  isLoading?: boolean;
}

interface ComparisonResult {
  field: string;
  label: string;
  icon: React.ElementType;
  value1: number | null;
  value2: number | null;
  diff: number | null;
  diffPercent: number | null;
  isDifferent: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
    case "scheduled":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
    case "suspended":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400";
    case "archived":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function safeParseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num;
}

function formatReason(reason: string | null): string {
  if (!reason) return "—";

  const scheduledMatch = reason.match(/Scheduled for ([\d-]+T[\d:.]+Z): (.+)/);
  if (scheduledMatch) {
    const [, dateStr, message] = scheduledMatch;
    return `📅 ${formatDate(dateStr)}: ${message}`;
  }

  const restoreMatch = reason.match(
    /Auto-restored as fallback after suspension of v(\d+): (.+)/,
  );
  if (restoreMatch) {
    const [, version, message] = restoreMatch;
    return `↩️ Auto-restored (v${version}): ${message}`;
  }

  const supersededMatch = reason.match(/Superseded by v(\d+): (.+)/);
  if (supersededMatch) {
    const [, version, message] = supersededMatch;
    return `↗️ Superseded by v${version}: ${message}`;
  }

  return reason;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function PricingCompare({
  tiers,
  isLoading = false,
}: PricingCompareProps) {
  const [selectedVersion1, setSelectedVersion1] = useState<string>("");
  const [selectedVersion2, setSelectedVersion2] = useState<string>("");

  const sortedTiers = useMemo(() => {
    return [...tiers].sort((a, b) => b.version - a.version);
  }, [tiers]);

  const tier1 = useMemo(() => {
    return tiers.find((t) => t.id === selectedVersion1);
  }, [tiers, selectedVersion1]);

  const tier2 = useMemo(() => {
    return tiers.find((t) => t.id === selectedVersion2);
  }, [tiers, selectedVersion2]);

  // ✅ FIXED: Properly parse string values to numbers
  const comparisons = useMemo((): ComparisonResult[] => {
    if (!tier1 || !tier2) return [];

    const fields = [
      { field: "feedCostPerKg", label: "Feed Price (KES/kg)", icon: Package },
      { field: "eggPricePerTray", label: "Egg Price (KES/tray)", icon: Egg },
      {
        field: "broilerPricePerKg",
        label: "Broiler Price (KES/kg)",
        icon: Weight,
      },
      {
        field: "mortalityCostPerBird",
        label: "Mortality Cost (KES/bird)",
        icon: AlertCircle,
      },
      {
        field: "dayOldChickWeightKg",
        label: "Day Old Chick Weight (kg)",
        icon: Weight,
      },
    ];

    if (tier1.waterCostPerLitre !== null || tier2.waterCostPerLitre !== null) {
      fields.push({
        field: "waterCostPerLitre",
        label: "Water Cost (KES/L)",
        icon: Droplet,
      });
    }

    if (
      tier1.electricityCostPerUnit !== null ||
      tier2.electricityCostPerUnit !== null
    ) {
      fields.push({
        field: "electricityCostPerUnit",
        label: "Electricity Cost (KES/kWh)",
        icon: Zap,
      });
    }

    return fields.map(({ field, label, icon }) => {
      // ✅ Parse string values to numbers
      const raw1 = tier1[field as keyof PricingTier];
      const raw2 = tier2[field as keyof PricingTier];

      const num1 = safeParseNumber(raw1);
      const num2 = safeParseNumber(raw2);

      const diff = num1 !== null && num2 !== null ? num2 - num1 : null;
      const diffPercent =
        num1 !== null && num2 !== null && num1 !== 0
          ? ((num2 - num1) / Math.abs(num1)) * 100
          : null;

      return {
        field,
        label,
        icon,
        value1: num1,
        value2: num2,
        diff,
        diffPercent,
        isDifferent: diff !== null && Math.abs(diff) > 0.001,
      };
    });
  }, [tier1, tier2]);

  const hasSelection = tier1 && tier2;
  const isSameVersion =
    selectedVersion1 &&
    selectedVersion2 &&
    selectedVersion1 === selectedVersion2;

  const handleSwap = () => {
    const temp = selectedVersion1;
    setSelectedVersion1(selectedVersion2);
    setSelectedVersion2(temp);
  };

  const handleClear = () => {
    setSelectedVersion1("");
    setSelectedVersion2("");
  };

  if (isLoading) {
    return <PricingCompareSkeleton />;
  }

  if (tiers.length < 2) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-muted/20 p-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Need at least 2 versions to compare
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Create more pricing versions to enable comparison
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Version 1</CardTitle>
            <CardDescription>
              Select the first version to compare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedVersion1}
              onValueChange={setSelectedVersion1}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select version..." />
              </SelectTrigger>
              <SelectContent>
                {sortedTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    v{tier.version} - {tier.status} -{" "}
                    {formatDate(tier.effectiveDate || tier.createdAt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tier1 && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    className={cn("text-xs", getStatusColor(tier1.status))}
                  >
                    {tier1.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(tier1.createdAt)}</span>
                </div>
                {tier1.creationReason && (
                  <div className="mt-2 rounded-lg bg-muted/20 p-2 text-xs">
                    <span className="font-medium">Reason:</span>{" "}
                    <span className="text-muted-foreground">
                      {formatReason(tier1.creationReason)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Version 2</CardTitle>
            <CardDescription>
              Select the second version to compare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedVersion2}
              onValueChange={setSelectedVersion2}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select version..." />
              </SelectTrigger>
              <SelectContent>
                {sortedTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    v{tier.version} - {tier.status} -{" "}
                    {formatDate(tier.effectiveDate || tier.createdAt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tier2 && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    className={cn("text-xs", getStatusColor(tier2.status))}
                  >
                    {tier2.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(tier2.createdAt)}</span>
                </div>
                {tier2.creationReason && (
                  <div className="mt-2 rounded-lg bg-muted/20 p-2 text-xs">
                    <span className="font-medium">Reason:</span>{" "}
                    <span className="text-muted-foreground">
                      {formatReason(tier2.creationReason)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {hasSelection && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={handleSwap}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Swap Versions
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear Selection
          </Button>
          {isSameVersion && (
            <Badge variant="destructive" className="text-xs">
              Please select different versions
            </Badge>
          )}
        </div>
      )}

      {/* Comparison Results */}
      {hasSelection && !isSameVersion && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-3">
                  Comparison Results
                  <Badge variant="outline" className="text-xs">
                    v{tier1.version} ↔ v{tier2.version}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Comparing pricing changes between the two versions
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Increase
                </span>
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                  Decrease
                </span>
                <span className="flex items-center gap-1">
                  <Minus className="h-3 w-3 text-gray-400" />
                  No Change
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Version Header */}
              <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-3 text-sm font-medium">
                <div>Metric</div>
                <div className="text-center">
                  <Badge
                    className={cn("text-xs", getStatusColor(tier1.status))}
                  >
                    v{tier1.version}
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge
                    className={cn("text-xs", getStatusColor(tier2.status))}
                  >
                    v{tier2.version}
                  </Badge>
                </div>
              </div>

              {/* Comparison Rows */}
              {comparisons.map((item) => {
                const isDifferent = item.isDifferent;
                const diffColor =
                  item.diff && item.diff > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : item.diff && item.diff < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-gray-400";

                const diffIcon =
                  item.diff && item.diff > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : item.diff && item.diff < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  );

                return (
                  <div
                    key={item.field}
                    className={cn(
                      "grid grid-cols-3 gap-4 rounded-lg p-3 text-sm transition-colors",
                      isDifferent
                        ? "bg-muted/10 hover:bg-muted/20"
                        : "bg-muted/5",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                    <div className="text-center font-mono">
                      {item.value1 !== null ? item.value1.toFixed(2) : "—"}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-center font-mono">
                      <span>
                        {item.value2 !== null ? item.value2.toFixed(2) : "—"}
                      </span>
                      {isDifferent && (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            diffColor,
                          )}
                        >
                          {diffIcon}
                          {item.diff !== null && (
                            <>
                              {item.diff > 0 ? "+" : ""}
                              {item.diff.toFixed(2)}
                              {item.diffPercent !== null && (
                                <span className="text-[10px] opacity-70">
                                  ({item.diffPercent > 0 ? "+" : ""}
                                  {item.diffPercent.toFixed(1)}%)
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      )}
                      {!isDifferent && (
                        <span className="text-xs text-gray-400">No change</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Summary */}
              <div className="mt-4 rounded-lg border border-dashed p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Summary</p>
                    <p className="text-xs text-muted-foreground">
                      {comparisons.filter((c) => c.isDifferent).length} of{" "}
                      {comparisons.length} metrics changed
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      Increases:{" "}
                      {comparisons.filter((c) => c.diff && c.diff > 0).length}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                      Decreases:{" "}
                      {comparisons.filter((c) => c.diff && c.diff < 0).length}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                      Unchanged:{" "}
                      {comparisons.filter((c) => !c.isDifferent).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasSelection && tiers.length >= 2 && (
        <div className="rounded-xl border-2 border-dashed bg-card p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted/20 p-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Select two versions to compare
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Choose versions from the dropdowns above to see side-by-side
                comparison
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function PricingCompareSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-4">
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div className="h-8 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
