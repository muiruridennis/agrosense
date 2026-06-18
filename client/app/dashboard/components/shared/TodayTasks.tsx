"use client";

import { useTodayTasks } from "../../hooks/useTodayTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Clock, MapPin, ChevronRight } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TodayTasksProps {
  farmId: string;
}

export function TodayTasks({ farmId }: TodayTasksProps) {
  const { data: tasks, isLoading } = useTodayTasks(farmId);
  const queryClient = useQueryClient();

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await apiClient.patch(`/farms/${farmId}/tasks/${taskId}`, {
        status: completed ? "completed" : "pending",
      });
      queryClient.invalidateQueries({ queryKey: ["tasks", "today", farmId] });
      toast.success(completed ? "Task completed!" : "Task reopened");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  if (isLoading) {
    return <TasksSkeleton />;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Today's Tasks</span>
            <Badge variant="secondary">0 pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <ClipboardList className="h-8 w-8 opacity-50" />
            <p className="text-sm">All caught up! 🎉</p>
            <p className="text-xs">No pending tasks for today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Today's Tasks</span>
          <Badge variant={pendingCount > 0 ? "default" : "secondary"}>
            {pendingCount} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={(completed) => handleToggleTask(task.id, completed)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function TaskCard({
  task,
  onToggle,
}: {
  task: any;
  onToggle: (completed: boolean) => void;
}) {
  const [isCompleted, setIsCompleted] = useState(task.status === "completed");

  const priorityColors = {
    high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    low: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  };

  const handleCheck = (checked: boolean) => {
    setIsCompleted(checked);
    onToggle(checked);
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      <Checkbox checked={isCompleted} onCheckedChange={handleCheck} className="mt-0.5" />
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`font-medium ${isCompleted ? "line-through" : ""}`}>
            {task.title}
          </p>
          <Badge className={priorityColors[task.priority || "medium"]}>
            {task.priority || "Medium"}
          </Badge>
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {task.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {task.location}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{task.estimatedMinutes} min
            </span>
          )}
          {task.dueTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due {new Date(task.dueTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TasksSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}