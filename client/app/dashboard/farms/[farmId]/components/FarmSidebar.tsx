// app/dashboard/farms/[farmId]/components/FarmSidebar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sprout,
  Rabbit,
  Package,
  DollarSign,
  Users,
  Settings,
  ClipboardList,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FarmMemberRole } from "@/types";

interface FarmSidebarProps {
  farmId: string;
  role: FarmMemberRole;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION CONFIG
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  /** Which roles can see this item */
  roles: FarmMemberRole[];
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "",
    roles: [
      FarmMemberRole.OWNER,
      FarmMemberRole.MANAGER,
      FarmMemberRole.WORKER,
    ],
  },
  {
    label: "Poultry",
    icon: Sprout,
    href: "poultry",
    roles: [
      FarmMemberRole.OWNER,
      FarmMemberRole.MANAGER,
      FarmMemberRole.WORKER,
    ],
  },
  {
    label: "Livestock",
    icon: Rabbit,
    href: "livestock",
    roles: [
      FarmMemberRole.OWNER,
      FarmMemberRole.MANAGER,
      FarmMemberRole.WORKER,
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    href: "inventory",
    roles: [
      FarmMemberRole.OWNER,
      FarmMemberRole.MANAGER,
      FarmMemberRole.WORKER,
    ],
  },
  {
    label: "Finance",
    icon: DollarSign,
    href: "finance",
    roles: [FarmMemberRole.OWNER, FarmMemberRole.MANAGER],
  },
  {
    label: "Team",
    icon: Users,
    href: "team",
    roles: [FarmMemberRole.OWNER, FarmMemberRole.MANAGER],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "settings",
    roles: [FarmMemberRole.OWNER],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function FarmSidebar({ farmId, role }: FarmSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Filter items based on role
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const isActive = (href: string) => {
    if (href === "") {
      return pathname === `/dashboard/farms/${farmId}`;
    }
    return pathname === `/dashboard/farms/${farmId}/${href}`;
  };

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-0.5">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() =>
                router.push(`/dashboard/farms/${farmId}/${item.href}`)
              }
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
