// app/dashboard/farms/[farmId]/poultry/components/FlockDetailsSheet.tsx
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Users,
  Egg,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  ClipboardList,
  Plus,
  Download,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordForm } from "./RecordForm";
import { FlockRecordsChart } from "./FlockRecordsChart";
import type { Flock } from "../types";

interface FlockDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flock: Flock;
  houseName: string;
}

export function FlockDetailsSheet({
  open,
  onOpenChange,
  flock,
  houseName,
}: FlockDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showRecordForm, setShowRecordForm] = useState(false);

  const placementDate = new Date(flock.placementDate);
  const today = new Date();
  const daysInProduction = Math.floor((today.getTime() - placementDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetDays = flock.targetDays || 42;
  const daysRemaining = Math.max(0, targetDays - daysInProduction);
  const progressPercent = Math.min(100, (daysInProduction / targetDays) * 100);

  const mortalityCount = flock.initialCount - flock.currentCount;
  const mortalityRate = (mortalityCount / flock.initialCount) * 100;
  const expectedMortality = flock.expectedMortalityPercent || 5;
  const isMortalityHigh = mortalityRate > expectedMortality * 1.2;

  const avgWeight = flock.sales?.length
    ? flock.sales.reduce((sum, sale) => sum + sale.pricePerBird, 0) / flock.sales.length
    : null;

  const totalRevenue = flock.revenueTotal || 0;
  const totalCost = flock.feedCostTotal || 0;
  const netProfit = flock.netProfit || 0;
  const roiPercent = flock.roiPercent || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">{flock.breed}</SheetTitle>
              <SheetDescription>
                {houseName} · {flock.type.charAt(0).toUpperCase() + flock.type.slice(1)} Flock
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={cn(
                "text-[10px] capitalize",
                flock.status === "active" && "bg-emerald-100 text-emerald-700",
                flock.status === "closed" && "bg-gray-100 text-gray-700",
                flock.status === "planned" && "bg-blue-100 text-blue-700"
              )}>
                {flock.status}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {flock.currentStage}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* OVERVIEW TAB */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-5 mt-4">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <Users className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{flock.currentCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Current Birds</p>
                <p className="text-[10px] text-muted-foreground/60">
                  From {flock.initialCount.toLocaleString()} placed
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <Calendar className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{daysInProduction}</p>
                <p className="text-xs text-muted-foreground">Days in Production</p>
                {flock.type === "broilers" && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {daysRemaining} days remaining
                  </p>
                )}
              </div>
            </div>

            {/* Progress Bar for Broilers */}
            {flock.type === "broilers" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Production Progress</span>
                  <span className="font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Placement: {new Date(flock.placementDate).toLocaleDateString()}</span>
                  <span>Target Day {targetDays}</span>
                </div>
              </div>
            )}

            {/* Financial Metrics */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Financial Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    KES {totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Feed Cost</p>
                  <p className="text-lg font-semibold text-rose-600">
                    KES {totalCost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Profit</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    KES {netProfit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ROI</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    <p className="text-lg font-semibold text-emerald-600">
                      {roiPercent.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Alerts */}
            {isMortalityHigh && flock.status === "active" && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
                      High Mortality Alert
                    </p>
                    <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
                      Mortality rate {mortalityRate.toFixed(1)}% exceeds target {expectedMortality}%.
                      {mortalityCount} birds lost out of {flock.initialCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Dates */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Key Dates</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Placement Date</p>
                  <p className="font-medium">{new Date(flock.placementDate).toLocaleDateString()}</p>
                </div>
                {flock.closedAt && (
                  <div>
                    <p className="text-muted-foreground">Closed Date</p>
                    <p className="font-medium">{new Date(flock.closedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {flock.productionStartWeek && (
                  <div>
                    <p className="text-muted-foreground">Production Start</p>
                    <p className="font-medium">Week {flock.productionStartWeek}</p>
                  </div>
                )}
                {flock.targetDays && (
                  <div>
                    <p className="text-muted-foreground">Harvest Target</p>
                    <p className="font-medium">Day {flock.targetDays}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {flock.notes && (
              <div className="rounded-lg bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{flock.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowRecordForm(true)}
                className="flex-1 gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </TabsContent>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* RECORDS TAB */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <TabsContent value="records" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Daily Records</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecordForm(true)}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>

            <FlockRecordsChart flockId={flock.id} type={flock.type} />

            <Separator />

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {/* Record list would go here */}
                <p className="text-center text-sm text-muted-foreground py-8">
                  No records yet. Click "Add Record" to log daily data.
                </p>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* ANALYTICS TAB */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <TabsContent value="analytics" className="space-y-5 mt-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Performance Metrics</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mortality Rate</span>
                    <span className={cn(
                      mortalityRate > expectedMortality ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {mortalityRate.toFixed(1)}% / {expectedMortality}% target
                    </span>
                  </div>
                  <Progress
                    value={(mortalityRate / expectedMortality) * 100}
                    className="h-1.5"
                    indicatorClassName={mortalityRate > expectedMortality ? "bg-rose-500" : "bg-emerald-500"}
                  />
                </div>

                {flock.type === "broilers" && avgWeight && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Weight</span>
                      <span>{avgWeight.toFixed(1)} kg / {flock.targetWeightKg} kg target</span>
                    </div>
                    <Progress
                      value={(avgWeight / (flock.targetWeightKg || 2.2)) * 100}
                      className="h-1.5"
                    />
                  </div>
                )}

                {flock.type === "broilers" && flock.feedConversionRatio && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Feed Conversion Ratio (FCR)</span>
                      <span>{flock.feedConversionRatio} / 1.8 target</span>
                    </div>
                    <Progress
                      value={(1.8 / (flock.feedConversionRatio || 2)) * 100}
                      className="h-1.5"
                      indicatorClassName="bg-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sales History */}
            {flock.sales && flock.sales.length > 0 && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sales History</span>
                </div>
                <div className="space-y-2">
                  {flock.sales.map((sale, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{sale.buyer}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.quantity} birds · {new Date(sale.saleDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">KES {sale.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          KES {sale.pricePerBird}/bird
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Record Form Dialog */}
        {showRecordForm && (
          <RecordForm
            open={showRecordForm}
            onOpenChange={setShowRecordForm}
            flockId={flock.id}
            flockType={flock.type}
            onSuccess={() => {
              setShowRecordForm(false);
              // Refetch data
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}