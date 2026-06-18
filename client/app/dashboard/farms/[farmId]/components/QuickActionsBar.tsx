// app/dashboard/farms/[farmId]/components/QuickActionsBar.tsx
"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, Package, Users, Settings } from "lucide-react";

interface QuickActionsBarProps {
  farmId: string;
}

export function QuickActionsBar({ farmId }: QuickActionsBarProps) {
  const router = useRouter();

  const actions = [
    { label: "Log Task", icon: ClipboardList, href: `/dashboard/farms/${farmId}/tasks/new` },
    { label: "Update Inventory", icon: Package, href: `/dashboard/farms/${farmId}/inventory` },
    { label: "Manage Team", icon: Users, href: `/dashboard/farms/${farmId}/team` },
    { label: "Settings", icon: Settings, href: `/dashboard/farms/${farmId}/settings` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => router.push(action.href)}
          className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground"
        >
          <action.icon className="h-3 w-3" />
          {action.label}
        </button>
      ))}
    </div>
  );
}