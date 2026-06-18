// app/dashboard/farms/[farmId]/components/FarmRecentActivity.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, AlertCircle, Package, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FarmRecentActivityProps {
  farmId: string;
}

const activityConfig = {
  task_completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  alert_raised: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  inventory_updated: { icon: Package, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  transaction: { icon: DollarSign, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
};

export function FarmRecentActivity({ farmId }: FarmRecentActivityProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["farm-activity", farmId],
    queryFn: async () => {
      const res = await apiClient.get(`/farms/${farmId}/activity/recent`, {
        params: { limit: 8 },
      });
      return res.data.data || [];
    },
    enabled: !!farmId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity: any) => {
          const config = activityConfig[activity.type as keyof typeof activityConfig] || activityConfig.task_completed;
          const Icon = config.icon;
          const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn("rounded-full p-1.5", config.bg)}>
                <Icon className={cn("h-3.5 w-3.5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.userName}</span>
                  <span className="text-muted-foreground"> {activity.description}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}