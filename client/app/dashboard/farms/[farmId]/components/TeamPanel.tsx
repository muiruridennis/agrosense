// app/dashboard/farms/[farmId]/components/TeamPanel.tsx
"use client";

import { useRouter } from "next/navigation";
import { Users, ChevronRight, UserPlus, Crown, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Farm } from "../../types";

interface TeamPanelProps {
  members: Farm["members"];
  farmId: string;
}

const ROLE_CONFIG = {
  owner: {
    icon: Crown,
    style: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    label: "Owner",
  },
  manager: {
    icon: Shield,
    style: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Manager",
  },
  worker: {
    icon: User,
    style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    label: "Worker",
  },
};

export function TeamPanel({ members, farmId }: TeamPanelProps) {
  const router = useRouter();

  if (!members?.length) return null;

  const active = members.filter((m) => m.isActive);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Team</h3>
            <p className="text-xs text-muted-foreground">
              {active.length} active member{active.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/farms/${farmId}/team`)}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </button>
      </div>

      <div className="divide-y">
        {active.map((member) => {
          const RoleIcon = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG]?.icon || User;
          const roleStyle = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG]?.style || ROLE_CONFIG.worker.style;
          const roleLabel = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG]?.label || member.role;

          const joined = new Date(member.joinedAt);
          const sinceDays = Math.floor((Date.now() - joined.getTime()) / 86_400_000);
          const since = sinceDays < 30
            ? `${sinceDays} days ago`
            : sinceDays < 365
              ? `${Math.floor(sinceDays / 30)} months ago`
              : `${Math.floor(sinceDays / 365)} years ago`;

          return (
            <div key={member.id} className="flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-muted/30">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                  {member.userId.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    {member.userId.slice(0, 8)}...
                  </p>
                  <Badge className={cn("text-[9px] font-medium", roleStyle)}>
                    <RoleIcon className="mr-1 h-2.5 w-2.5" />
                    {roleLabel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Joined {since}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
            </div>
          );
        })}
      </div>
    </div>
  );
}