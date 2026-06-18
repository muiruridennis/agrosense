"use client";

import { useRecentActivity } from "../../hooks/useRecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Package,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  farmId: string;
  limit?: number;
}

const activityIcons = {
  task_completed: { icon: CheckCircle, color: "text-green-500" },
  alert_raised: { icon: AlertCircle, color: "text-red-500" },
  inventory_updated: { icon: Package, color: "text-blue-500" },
  transaction: { icon: DollarSign, color: "text-amber-500" },
};

export function RecentActivity({ farmId, limit = 10 }: RecentActivityProps) {
  const { data: activities, isLoading } = useRecentActivity(farmId, limit);

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Activity className="h-8 w-8 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Recent Activity</span>
          <span className="text-xs text-muted-foreground">
            Last {activities.length} events
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const IconConfig = activityIcons[
            activity.type as keyof typeof activityIcons
          ] || {
            icon: Activity,
            color: "text-muted-foreground",
          };
          const Icon = IconConfig.icon;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted">
                  <Icon className={`h-4 w-4 ${IconConfig.color}`} />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.userName}</span>{" "}
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
