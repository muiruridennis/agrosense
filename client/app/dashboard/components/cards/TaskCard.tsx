"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: "high" | "medium" | "low";
    status: "pending" | "in_progress" | "completed";
    location?: string;
    estimatedMinutes?: number;
    dueTime?: string;
  };
  onToggle?: (completed: boolean) => void;
  onClick?: () => void;
  compact?: boolean;
}

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export function TaskCard({ task, onToggle, onClick, compact = false }: TaskCardProps) {
  const isCompleted = task.status === "completed";

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50",
          isCompleted && "opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          {onToggle && (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => onToggle(checked as boolean)}
            />
          )}
          <div>
            <p className={cn("font-medium", isCompleted && "line-through")}>
              {task.title}
            </p>
            {task.dueTime && (
              <p className="text-xs text-muted-foreground">
                Due {new Date(task.dueTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
        <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
      </div>
    );
  }

  return (
    <Card
      className={cn("cursor-pointer transition-all hover:shadow-md", isCompleted && "opacity-60")}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {onToggle && (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => onToggle(checked as boolean)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5"
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className={cn("font-semibold", isCompleted && "line-through")}>
                {task.title}
              </h4>
              <Badge className={priorityColors[task.priority]}>
                {task.priority}
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
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}