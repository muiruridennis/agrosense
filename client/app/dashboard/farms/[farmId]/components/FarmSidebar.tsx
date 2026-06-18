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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FarmSidebarProps {
  farmId: string;
  farmName: string;
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "" },
  { label: "Poultry", icon: Sprout, href: "poultry" },
  { label: "Livestock", icon: Rabbit, href: "livestock" },
  { label: "Inventory", icon: Package, href: "inventory" },
  { label: "Finance", icon: DollarSign, href: "finance" },
  { label: "Team", icon: Users, href: "team" },
  { label: "Settings", icon: Settings, href: "settings" },
];

export function FarmSidebar({ farmId }: FarmSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "") {
      return pathname === `/dashboard/farms/${farmId}`;
    }
    return pathname === `/dashboard/farms/${farmId}/${href}`;
  };

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(`/dashboard/farms/${farmId}/${item.href}`)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
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