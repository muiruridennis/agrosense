"use client";

import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  PlusCircle,
  AlertTriangle,
  ScanLine,
  TrendingUp,
  Package,
  Users,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsBarProps {
  role: "owner" | "manager" | "worker";
  farmId: string;
}

export function QuickActionsBar({ role, farmId }: QuickActionsBarProps) {
  const router = useRouter();

  const actions = {
    worker: [
      {
        icon: ClipboardList,
        label: "Log Task",
        href: `/farms/${farmId}/tasks/new`,
        primary: true,
        color: "default",
      },
      {
        icon: ScanLine,
        label: "Scan QR",
        href: `/farms/${farmId}/scan`,
        primary: false,
        color: "outline",
      },
      {
        icon: PlusCircle,
        label: "Quick Record",
        href: `/farms/${farmId}/records/quick`,
        primary: false,
        color: "outline",
      },
      {
        icon: AlertTriangle,
        label: "Report Issue",
        href: `/farms/${farmId}/issues/new`,
        primary: false,
        color: "destructive",
      },
    ],
    manager: [
      {
        icon: Package,
        label: "Check Stock",
        href: `/farms/${farmId}/inventory`,
        primary: false,
        color: "outline",
      },
      {
        icon: ClipboardList,
        label: "Assign Tasks",
        href: `/farms/${farmId}/tasks/assign`,
        primary: true,
        color: "default",
      },
      {
        icon: TrendingUp,
        label: "Quick Report",
        href: `/farms/${farmId}/reports/quick`,
        primary: false,
        color: "outline",
      },
      {
        icon: Users,
        label: "Team",
        href: `/farms/${farmId}/team`,
        primary: false,
        color: "outline",
      },
    ],
    owner: [
      {
        icon: TrendingUp,
        label: "Financials",
        href: `/farms/${farmId}/finance`,
        primary: true,
        color: "default",
      },
      {
        icon: Package,
        label: "Inventory",
        href: `/farms/${farmId}/inventory`,
        primary: false,
        color: "outline",
      },
      {
        icon: FileText,
        label: "Reports",
        href: `/farms/${farmId}/reports`,
        primary: false,
        color: "outline",
      },
      {
        icon: Users,
        label: "Team",
        href: `/farms/${farmId}/team`,
        primary: false,
        color: "outline",
      },
    ],
  };

  const userActions = actions[role];

  return (
    <div className="flex flex-wrap gap-2">
      {userActions.map((action) => (
        <Button
          key={action.label}
          onClick={() => router.push(action.href)}
          variant={action.primary ? "default" : action.color === "destructive" ? "destructive" : "outline"}
          size="sm"
          className="gap-2"
        >
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}