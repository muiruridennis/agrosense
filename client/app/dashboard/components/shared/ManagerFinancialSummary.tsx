// dashboard/components/ManagerFinancialSummary/ManagerFinancialSummary.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ManagerFinancialSummaryProps {
  farmId: string;
}

interface FinancialData {
  currentMonth: {
    period: string;
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    profitMargin: number;
  };
  previousMonth: {
    period: string;
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    profitMargin: number;
  };
}

export function ManagerFinancialSummary({
  farmId,
}: ManagerFinancialSummaryProps) {
  const now = new Date();
  const currentPeriod = now.toISOString().slice(0, 7);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousPeriod = previous.toISOString().slice(0, 7);

  const { data, isLoading, error } = useQuery({
    queryKey: ["finance", "summary", farmId, currentPeriod],
    queryFn: async () => {
      const res = await apiClient.get<FinancialData>(
        `/finance/farms/${farmId}/compare?current=${currentPeriod}&previous=${previousPeriod}`
      );
      return res.data;
    },
    enabled: !!farmId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return <FinancialSkeleton />;
  }

  if (error || !data) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Unable to load financial data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const current = data.currentMonth;
  const previous_ = data.previousMonth;

  // Calculate month-over-month changes
  const revenueTrend = current.totalRevenue - previous_.totalRevenue;
  const costsTrend = current.totalCosts - previous_.totalCosts;
  const profitTrend = current.grossProfit - previous_.grossProfit;
  const marginTrend = current.profitMargin - previous_.profitMargin;

  const revenuePercent =
    previous_.totalRevenue > 0
      ? ((revenueTrend / previous_.totalRevenue) * 100).toFixed(1)
      : 0;
  const costsPercent =
    previous_.totalCosts > 0
      ? ((costsTrend / previous_.totalCosts) * 100).toFixed(1)
      : 0;
  const profitPercent =
    previous_.grossProfit > 0
      ? ((profitTrend / previous_.grossProfit) * 100).toFixed(1)
      : 0;

  // Health check
  const isHealthy = current.profitMargin > 0;
  const isWarning = current.profitMargin > -10 && current.profitMargin <= 0;
  const isCritical = current.profitMargin <= -10;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card
        className={`transition-all ${
          isCritical
            ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/10"
            : isWarning
              ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10"
              : "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/10"
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">This Month's Performance</CardTitle>
            <Badge
              variant={
                isHealthy ? "default" : isWarning ? "secondary" : "destructive"
              }
            >
              {isHealthy ? "📈 Profitable" : isWarning ? "⚠️ Breaking Even" : "📉 Loss"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Three Main Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Revenue */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  KES {current.totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  {revenueTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      revenueTrend >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {revenueTrend >= 0 ? "+" : ""}{revenuePercent}% vs last month
                  </span>
                </div>
              </div>
            </div>

            {/* Costs */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Costs</p>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  KES {current.totalCosts.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  {costsTrend <= 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      costsTrend <= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {costsTrend <= 0 ? "-" : "+"}{costsPercent}% vs last month
                  </span>
                </div>
              </div>
            </div>

            {/* Profit Margin */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <div className="space-y-1">
                <p
                  className={`text-2xl font-bold ${
                    isHealthy
                      ? "text-green-600 dark:text-green-400"
                      : isWarning
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {current.profitMargin.toFixed(1)}%
                </p>
                <div className="flex items-center gap-2">
                  {marginTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      marginTrend >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {marginTrend >= 0 ? "+" : ""}{marginTrend.toFixed(1)}pp vs last month
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit/Loss Summary */}
          <div
            className={`rounded-lg p-4 ${
              isHealthy
                ? "bg-green-100 dark:bg-green-950/30"
                : isWarning
                  ? "bg-amber-100 dark:bg-amber-950/30"
                  : "bg-red-100 dark:bg-red-950/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gross Profit
                </p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    isHealthy
                      ? "text-green-700 dark:text-green-400"
                      : isWarning
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-red-700 dark:text-red-400"
                  }`}
                >
                  KES {current.grossProfit.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">
                  Month Comparison
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {profitTrend >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-lg font-bold ${
                      profitTrend >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {profitTrend >= 0 ? "+" : ""}{profitPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold">Key Insights</p>
            <div className="space-y-1 text-sm">
              {isHealthy && (
                <InsightText icon="✅" text="Farm is profitable this month" />
              )}
              {isWarning && (
                <InsightText
                  icon="⚠️"
                  text="Profit margin is below target. Review cost structure."
                />
              )}
              {isCritical && (
                <InsightText
                  icon="🚨"
                  text="Farm is operating at a loss. Immediate action needed."
                />
              )}
              {revenueTrend > 0 && (
                <InsightText
                  icon="📈"
                  text={`Revenue increased ${revenuePercent}% from last month`}
                />
              )}
              {costsTrend > 0 && (
                <InsightText
                  icon="📊"
                  text={`Costs increased ${costsPercent}% from last month`}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Comparison Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Month Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ComparisonRow
              label="Revenue"
              current={current.totalRevenue}
              previous={previous_.totalRevenue}
            />
            <ComparisonRow
              label="Costs"
              current={current.totalCosts}
              previous={previous_.totalCosts}
            />
            <ComparisonRow
              label="Profit"
              current={current.grossProfit}
              previous={previous_.grossProfit}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

interface ComparisonRowProps {
  label: string;
  current: number;
  previous: number;
}

function ComparisonRow({ label, current, previous }: ComparisonRowProps) {
  const diff = current - previous;
  const percentChange =
    previous > 0 ? ((diff / previous) * 100).toFixed(1) : "0";

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {current.toLocaleString()} KES
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">vs {previous.toLocaleString()}</p>
        <p
          className={`text-sm font-semibold ${
            diff >= 0
              ? label === "Profit"
                ? "text-green-600 dark:text-green-400"
                : label === "Revenue"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              : label === "Profit"
                ? "text-red-600 dark:text-red-400"
                : label === "Revenue"
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
          }`}
        >
          {diff >= 0 ? "+" : ""}{percentChange}%
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

interface InsightTextProps {
  icon: string;
  text: string;
}

function InsightText({ icon, text }: InsightTextProps) {
  return (
    <p className="text-muted-foreground">
      <span className="mr-2">{icon}</span>
      {text}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────

function FinancialSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}