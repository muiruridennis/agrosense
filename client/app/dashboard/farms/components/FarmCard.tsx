// app/dashboard/farms/components/FarmCard.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  MapPin,
  Ruler,
  Users,
  Sprout,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Farm } from "../types";

interface FarmCardProps {
  farm: Farm;
  onEdit: (farm: Farm) => void;
  onDelete: (farm: Farm) => void;
  onViewDetails?: (farm: Farm) => void;
}

const roleColors = {
  owner: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/20",
  manager: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/20",
  worker: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/20",
};

const roleIcons = {
  owner: "👑",
  manager: "📋",
  worker: "🔧",
};

// Helper to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function FarmCard({ farm, onEdit, onDelete, onViewDetails }: FarmCardProps) {
  const router = useRouter();
  const role = farm.role || "worker";
  const RoleIcon = roleIcons[role as keyof typeof roleIcons] || "🌾";

  const handleCardClick = () => {
    router.push(`/dashboard/farms/${farm.id}`);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        "border-border/50 bg-gradient-to-br from-card to-muted/5",
        "animate-fade-in-up"
      )}
    >
      {/* Premium gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Top accent bar - gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />

      {/* Decorative corner element */}
      <div className="absolute -right-6 -top-6 h-12 w-12 rounded-full bg-primary/5 blur-xl transition-all duration-500 group-hover:bg-primary/10" />

      <div className="relative p-5">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Farm name with role badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold tracking-tight text-foreground line-clamp-1">
                {farm.name}
              </h3>
              <Badge
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider border",
                  roleColors[role]
                )}
              >
                <span className="mr-1">{RoleIcon}</span>
                {role}
              </Badge>
            </div>

            {/* Location with icon */}
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {farm.region}
                {farm.subRegion && `, ${farm.subRegion}`}
                {farm.country && `, ${farm.country}`}
              </span>
            </div>
          </div>

          {/* Actions Dropdown - stops propagation */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => handleAction(e as any, () => router.push(`/dashboard/farms/${farm.id}`))}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(e as any, () => onEdit(farm))}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Farm
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAction(e as any, () => onDelete(farm))}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Farm
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description - with gradient fade if too long */}
        {farm.description && (
          <div className="relative mt-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {farm.description}
            </p>
            {farm.description.length > 100 && (
              <div className="absolute bottom-0 right-0 pl-4 bg-gradient-to-l from-card to-transparent pointer-events-none">
                <span className="text-xs text-primary/60">...</span>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid - Premium cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {/* Area Stat */}
          <div className="rounded-lg bg-muted/30 p-2.5 text-center transition-all group-hover:bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Ruler className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Area</span>
            </div>
            <p className="mt-1 text-base font-bold text-foreground">
              {farm.areaHectares} <span className="text-xs font-normal text-muted-foreground">ha</span>
            </p>
          </div>

          {/* Plots Stat */}
          <div className="rounded-lg bg-muted/30 p-2.5 text-center transition-all group-hover:bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Sprout className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Plots</span>
            </div>
            <p className="mt-1 text-base font-bold text-foreground">
              {farm.activePlots ?? "—"}
            </p>
          </div>

          {/* Team Stat */}
          <div className="rounded-lg bg-muted/30 p-2.5 text-center transition-all group-hover:bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Team</span>
            </div>
            <p className="mt-1 text-base font-bold text-foreground">
              {farm.members?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Footer with created date and CTA */}
        <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Calendar className="h-3 w-3" />
            <span>Created {getRelativeTime(farm.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-70 transition-all group-hover:opacity-100 group-hover:gap-2">
            <span>View Farm</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* Hover border effect */}
        <div className="absolute inset-0 rounded-xl border-2 border-transparent transition-all duration-300 group-hover:border-primary/10 pointer-events-none" />
      </div>
    </Card>
  );
}