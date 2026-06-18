// app/dashboard/farms/[farmId]/components/FarmContextBar.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Ruler, Globe, MoreVertical, Plus, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Farm } from "../../types";

interface FarmContextBarProps {
  farm: Farm;
  userRole: string;
}

export function FarmContextBar({ farm, userRole }: FarmContextBarProps) {
  const router = useRouter();

  const lat = farm.geoPoint?.coordinates[1];
  const lng = farm.geoPoint?.coordinates[0];

  const roleColors = {
    owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    worker: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  };

  return (
    <div className="sticky top-0 z-20 -mx-6 border-b bg-background/95 px-6 py-4 backdrop-blur-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left section */}
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/farms")}
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">All Farms</span>
          </button>

          <div className="hidden h-6 w-px bg-border/60 sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {farm.name}
              </h1>
              <Badge className={cn("border px-2 py-0.5 text-[10px] font-semibold uppercase", roleColors[userRole as keyof typeof roleColors] || roleColors.worker)}>
                {userRole}
              </Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {farm.region}{farm.subRegion && `, ${farm.subRegion}`}, {farm.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                {farm.areaHectares} hectares
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Since {new Date(farm.createdAt).toLocaleDateString("en-KE", { year: "numeric", month: "short" })}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {farm.members?.length || 0} members
              </span>
              {lat && lng && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/70">
                  <MapPin className="h-3 w-3" />
                  {lat.toFixed(4)}°, {lng.toFixed(4)}°
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/farms/${farm.id}/records/new`)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Record
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/farms/${farm.id}/settings`)}>
                Edit Farm Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/farms/${farm.id}/team`)}>
                Manage Team Members
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/farms/${farm.id}/analytics`)}>
                View Analytics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/farms")}>
                Switch to Another Farm
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}