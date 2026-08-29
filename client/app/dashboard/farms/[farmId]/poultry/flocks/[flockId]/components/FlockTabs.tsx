// app/dashboard/farms/[farmId]/poultry/components/FlockTabs.tsx

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  History,
  Heart,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePendingReviewRecords } from "../../../hooks/usePoultry";
import { FlockRecordsTab } from "./FlockRecordsTab";
import { FlockHealthTab } from "./FlockHealthTab";
import { FlockFinanceTab } from "./FlockFinanceTab";
import { FlockSalesTab } from "./FlockSalesTab";
import { PendingReviewTab } from "./PendingReviewTab";
import { FarmMemberRole } from "@/types";
import type { Flock } from "../../../types";

interface FlockTabsProps {
  flock: Flock;
  farmId: string;
  role: FarmMemberRole;
}

export function FlockTabs({ flock, farmId, role }: FlockTabsProps) {
  const [activeTab, setActiveTab] = useState("records");

  const isManager =
    role === FarmMemberRole.MANAGER || role === FarmMemberRole.OWNER;
  const isWorker = role === FarmMemberRole.WORKER;

  // ✅ Fetch pending review count for the badge
  const { data: pendingData } = usePendingReviewRecords(farmId, flock.id);
  const pendingCount = pendingData?.total || 0;

  // Base tabs - everyone sees these
  const tabs = [
    { id: "records", label: "Records", icon: History },
    { id: "health", label: "Health", icon: Heart },
    { id: "sales", label: "Sales", icon: ShoppingCart },
  ];

  // Finance tab - only managers and owners
  if (isManager) {
    tabs.push({ id: "finance", label: "Finance", icon: DollarSign });
  }

  // Pending Review tab - only managers and owners
  if (isManager && pendingCount > 0) {
    tabs.push({
      id: "pending-review",
      label: "Pending Review",
      icon: Users,
    });
  }

  // Alert tab - show if there are alerts
  const hasAlerts =
    (flock.expectedMortalityPercent || 5) > 0 &&
    ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100 >
      (flock.expectedMortalityPercent || 5);

  if (hasAlerts) {
    tabs.push({ id: "alerts", label: "Alerts", icon: AlertTriangle });
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
            <h3 className="text-sm font-medium text-foreground">
              Flock Management
            </h3>
            <p className="text-xs text-muted-foreground">
              {isWorker
                ? "Manage records, health, and sales"
                : "Manage records, health, finances, and sales"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <span
            className={cn(
              "text-xs font-medium capitalize",
              flock.status === "active"
                ? "text-emerald-600"
                : "text-muted-foreground",
            )}
          >
            {flock.status}
          </span>
          {/* Show role badge */}
          <span className="rounded bg-muted/50 px-2 py-0.5 text-[10px] font-medium capitalize">
            {role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <Tabs defaultValue="records" onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full justify-start gap-1 rounded-lg bg-muted/30 p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isAlert = tab.id === "alerts";
              const isPendingReview = tab.id === "pending-review";

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
                    "hover:bg-background/60 hover:text-foreground",
                    // Active state
                    isActive &&
                      !isAlert &&
                      !isPendingReview &&
                      "bg-background text-foreground shadow-sm ring-1 ring-border/50",
                    // Alert tab active state
                    isActive &&
                      isAlert &&
                      "bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800",
                    // Pending Review tab active state
                    isActive &&
                      isPendingReview &&
                      "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800",
                    // Alert tab inactive state
                    !isActive &&
                      isAlert &&
                      "text-rose-600 hover:bg-rose-50/50 dark:text-rose-400 dark:hover:bg-rose-950/20",
                    // Pending Review inactive state
                    !isActive &&
                      isPendingReview &&
                      "text-blue-600 hover:bg-blue-50/50 dark:text-blue-400 dark:hover:bg-blue-950/20",
                    // Default inactive state
                    !isActive &&
                      !isAlert &&
                      !isPendingReview &&
                      "text-muted-foreground",
                  )}
                >
                  <tab.icon
                    className={cn(
                      "h-4 w-4",
                      isActive &&
                        !isAlert &&
                        !isPendingReview &&
                        "text-primary",
                      isActive && isAlert && "text-rose-600 dark:text-rose-400",
                      isActive &&
                        isPendingReview &&
                        "text-blue-600 dark:text-blue-400",
                      isAlert &&
                        !isActive &&
                        "text-rose-500 dark:text-rose-400",
                      isPendingReview &&
                        !isActive &&
                        "text-blue-500 dark:text-blue-400",
                    )}
                  />
                  <span>{tab.label}</span>
                  {/* Active indicator dot */}
                  {isActive && !isAlert && !isPendingReview && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                  {isActive && isAlert && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                  {isActive && isPendingReview && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                  {tab.id === "alerts" && !isActive && hasAlerts && (
                    <span className="ml-0.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                  {/* ✅ Pending review count badge - now defined */}
                  {tab.id === "pending-review" &&
                    !isActive &&
                    pendingCount > 0 && (
                      <span className="ml-0.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] text-white">
                        {pendingCount}
                      </span>
                    )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Content */}
          <div className="mt-4">
            <TabsContent value="records" className="m-0 p-2">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-sm font-medium text-center">
                    Daily Records
                  </CardTitle>
                  <CardDescription className="text-xs text-center">
                    Track mortality, feed consumption, and production metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <FlockRecordsTab flock={flock} farmId={farmId} role={role} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="m-0">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-sm font-medium">
                    Health & Mortality
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Monitor health status and mortality trends
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <FlockHealthTab flock={flock} />
                </CardContent>
              </Card>
            </TabsContent>

            {isManager && (
              <TabsContent value="finance" className="m-0">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm font-medium">
                      Finance
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Revenue, costs, and profitability metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <FlockFinanceTab flock={flock} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

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

            {isManager && pendingCount > 0 && (
              <TabsContent value="pending-review" className="m-0">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-600">
                      <Users className="h-4 w-4" />
                      Pending Review
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {pendingCount} record{pendingCount !== 1 ? "s" : ""}{" "}
                      waiting for your approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <PendingReviewTab flock={flock} farmId={farmId} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

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
  const mortalityRate =
    ((flock?.initialCount - flock?.currentCount) / flock?.initialCount) * 100;
  const expectedMortality = flock?.expectedMortalityPercent || 5;

  return (
    <div className="space-y-4">
      {mortalityRate > expectedMortality && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-rose-800 dark:text-rose-300">
                High Mortality Alert
              </h4>
              <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">
                Mortality rate is {mortalityRate.toFixed(1)}%, exceeding the
                target of {expectedMortality}%.
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-500 mt-2">
                Recommended action: Review feed quality, check water sanitation,
                and consult veterinarian.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
