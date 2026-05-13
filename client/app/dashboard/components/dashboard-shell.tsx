"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Sprout,
  Rabbit,
  BookOpen,
  CloudSun,
  Bell,
  ChevronLeft,
  Menu,
  X,
  Leaf,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TopBar } from "./top-bar";

// ── Nav config ─────────────────────────────────────────────────────────────────

const NAV_MAIN = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Farms",
    href: "/dashboard/farms",
    icon: Leaf,
    exact: false,
  },
  {
    label: "Crops",
    href: "/dashboard/crops",
    icon: Sprout,
    exact: false,
    badge: null,
    domain: "crop" as const,
  },
  {
    label: "Livestock",
    href: "/dashboard/livestock",
    icon: Rabbit,
    exact: false,
    domain: "livestock" as const,
  },
  {
    label: "FarmLedger",
    href: "/dashboard/ledger",
    icon: BookOpen,
    exact: false,
    domain: "ledger" as const,
  },
  {
    label: "AgroAdvisor",
    href: "/dashboard/advisor",
    icon: CloudSun,
    exact: false,
    domain: "advisory" as const,
  },
  {
    label: "Alerts",
    href: "/dashboard/alerts",
    icon: AlertTriangle,
    exact: false,
  },
] as const;

const NAV_SECONDARY = [
  { label: "Credit Profile", href: "/dashboard/credit", icon: CreditCard },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
] as const;

// ── Domain accent colours — match global.css tokens ───────────────────────────

const DOMAIN_DOT: Record<string, string> = {
  crop: "bg-green-500",
  livestock: "bg-orange-400",
  ledger: "bg-amber-400",
  advisory: "bg-blue-400",
};

// ── Sidebar nav item ──────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  domain?: keyof typeof DOMAIN_DOT;
  badge?: number | null;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
  domain,
  badge,
  collapsed,
  onClick,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground hover:shadow-sm",
        collapsed && "justify-center px-2",
      )}
    >
      {/* Domain colour dot */}
      {domain && !collapsed && (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
            DOMAIN_DOT[domain],
            isActive
              ? "opacity-100 shadow-sm"
              : "opacity-0 group-hover:opacity-70",
          )}
        />
      )}

      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-transform duration-150",
          isActive && "scale-105",
        )}
      />

      {!collapsed && <span className="flex-1 truncate">{label}</span>}

      {!collapsed && badge != null && badge > 0 && (
        <Badge
          variant="destructive"
          className="ml-auto h-5 min-w-[20px] px-1 text-[10px]"
        >
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span
          className={cn(
            "pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap",
            "rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md",
            "opacity-0 transition-opacity group-hover:opacity-100",
          )}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base — fixed on mobile, relative in the flex shell on desktop
          "fixed inset-y-0 left-0 z-30 flex flex-col",
          "bg-sidebar/95 backdrop-blur-sm border-r border-sidebar-border/50",
          "shadow-lg shadow-black/5 dark:shadow-black/20",
          "transition-[transform,width] duration-300 ease-in-out",
          // Desktop widths
          "lg:relative lg:translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-64",
          // Mobile: slide in/out
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Sidebar navigation"
      >
        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex h-14 flex-shrink-0 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center px-2" : "justify-between",
          )}
        >
          {!collapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 focus-visible:outline-none"
            >
              <Leaf className="h-5 w-5 text-sidebar-primary" />
              <span className="text-sm font-semibold text-sidebar-foreground">
                Agro<span className="text-sidebar-primary">Sense</span>
              </span>
            </Link>
          )}

          {collapsed && (
            <Link href="/dashboard">
              <Leaf className="h-5 w-5 text-sidebar-primary" />
            </Link>
          )}

          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="ml-auto rounded p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Main nav ──────────────────────────────────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto px-2 py-3"
          aria-label="Main navigation"
        >
          <ul role="list" className="space-y-0.5">
            {NAV_MAIN.map((item) => (
              <li key={item.href}>
                <NavItem
                  {...item}
                  collapsed={collapsed}
                  onClick={onMobileClose}
                />
              </li>
            ))}
          </ul>

          <Separator className="my-3 bg-sidebar-border" />

          <ul role="list" className="space-y-0.5">
            {NAV_SECONDARY.map((item) => (
              <li key={item.href}>
                <NavItem
                  {...item}
                  collapsed={collapsed}
                  onClick={onMobileClose}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Collapse toggle — desktop only ─────────────────────────────────── */}
        <button
          onClick={onToggle}
          className={cn(
            "absolute -right-3 top-16 hidden lg:flex",
            "h-6 w-6 items-center justify-center rounded-full",
            "border border-border bg-background text-muted-foreground shadow-sm",
            "hover:text-foreground transition-colors",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </aside>
    </>
  );
}

// ── Shell — the App Shell layout ───────────────────────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    /*
      App Shell — the outer wrapper is a full-viewport flex row.
      Sidebar is in the normal flow (not fixed on desktop), content
      fills the remaining space. No z-index hacks, no margin-left offsets.
    */
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Right side: topbar + scrollable content ─────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main
          className="flex-1 overflow-y-auto bg-muted/20"
          id="main-content"
          tabIndex={-1}
        >
          {/* Inner wrapper — consistent page padding with improved spacing */}
          <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
