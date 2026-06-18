// app/dashboard/farms/[farmId]/poultry/components/FlockTabs.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Heart, DollarSign, ShoppingCart, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlockRecordsTab } from "./FlockRecordsTab";
import { FlockHealthTab } from "./FlockHealthTab";
import { FlockFinanceTab } from "./FlockFinanceTab";
import { FlockSalesTab } from "./FlockSalesTab";
import type { Flock } from "../../../types";

interface FlockTabsProps {
  flock: Flock;
  farmId: string;
}

export function FlockTabs({ flock, farmId }: FlockTabsProps) {
  const [activeTab, setActiveTab] = useState("records");

  const tabs = [
    { id: "records", label: "Records", icon: History },
    { id: "health", label: "Health", icon: Heart },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "sales", label: "Sales", icon: ShoppingCart },
  ];

  const hasAlerts = (flock.expectedMortalityPercent || 5) > 0 && 
    ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100 > (flock.expectedMortalityPercent || 5);

  if (hasAlerts) {
    tabs.splice(1, 0, { id: "alerts", label: "Alerts", icon: AlertTriangle });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Flock Management</h3>
            <p className="text-xs text-muted-foreground">
              Manage records, health, finances, and sales
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <span className={cn(
            "text-xs font-medium capitalize",
            flock.status === "active" ? "text-emerald-600" : "text-muted-foreground"
          )}>
            {flock.status}
          </span>
        </div>
      </div>

      {/* Tabs - Cleaner Style */}
      <div className="px-5 pt-4">
        <Tabs defaultValue="records" onValueChange={setActiveTab}>
          <TabsList className="bg-muted/40 p-0.5">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "gap-2 px-3.5 py-1.5 text-xs font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                  "hover:text-foreground",
                  "text-muted-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Content */}
          <div className="mt-4">
            <TabsContent value="records" className="m-0 p-2">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-sm font-medium text-center">Daily Records</CardTitle>
                  <CardDescription className="text-xs text-center">
                    Track mortality, feed consumption, and production metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <FlockRecordsTab flock={flock} farmId={farmId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="m-0">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-sm font-medium">Health & Mortality</CardTitle>
                  <CardDescription className="text-xs">
                    Monitor health status and mortality trends
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <FlockHealthTab flock={flock} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finance" className="m-0">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-sm font-medium">Finance</CardTitle>
                  <CardDescription className="text-xs">
                    Revenue, costs, and profitability metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <FlockFinanceTab flock={flock} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="m-0">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  <CardDescription className="text-xs">
                    Track bird sales and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <FlockSalesTab flock={flock} />
                </CardContent>
              </Card>
            </TabsContent>

            {hasAlerts && (
              <TabsContent value="alerts" className="m-0">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-rose-600">
                      <AlertTriangle className="h-4 w-4" />
                      Alerts
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Critical issues requiring attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <FlockAlertsTab flock={flock} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// Alerts Tab
function FlockAlertsTab({ flock }: { flock: Flock }) {
  const mortalityRate = ((flock?.initialCount - flock?.currentCount) / flock?.initialCount) * 100;
  const expectedMortality = flock?.expectedMortalityPercent || 5;
  
  return (
    <div className="space-y-4">
      {mortalityRate > expectedMortality && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-rose-800 dark:text-rose-300">High Mortality Alert</h4>
              <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">
                Mortality rate is {mortalityRate.toFixed(1)}%, exceeding the target of {expectedMortality}%.
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-500 mt-2">
                Recommended action: Review feed quality, check water sanitation, and consult veterinarian.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}