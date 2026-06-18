// app/dashboard/farms/[farmId]/components/FarmQuickActions.tsx
"use client";

import { Plus, ClipboardList, Package, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FarmQuickActionsProps {
  farmId: string;
}

export function FarmQuickActions({ farmId }: FarmQuickActionsProps) {
  const router = useRouter();

  const actions = [
    { label: "Add Record", icon: Plus, href: `/dashboard/farms/${farmId}/records/new` },
    { label: "Log Task", icon: ClipboardList, href: `/dashboard/farms/${farmId}/tasks/new` },
    { label: "Update Inventory", icon: Package, href: `/dashboard/farms/${farmId}/inventory` },
    { label: "Manage Team", icon: Users, href: `/dashboard/farms/${farmId}/team` },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="sm"
          onClick={() => router.push(action.href)}
          className="gap-1.5"
        >
          <action.icon className="h-3.5 w-3.5" />
          {action.label}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/dashboard/farms/${farmId}/settings`)}
        className="gap-1.5"
      >
        <Settings className="h-3.5 w-3.5" />
        Settings
      </Button>
    </div>
  );
}