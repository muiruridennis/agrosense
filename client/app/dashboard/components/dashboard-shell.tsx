"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Sprout,
  Rabbit,
  BookOpen,
  CloudSun,
  Bell,
  Menu,
  X,
  Leaf,
  CreditCard,
  AlertTriangle,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Package,
  Users,
  HelpCircle,
  Sparkles,
  Circle,
  ChevronUp,
  ChevronDown,
  Shield,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// ──────────────────────────────────────────────────────────────────────────
// SHELL LAYOUT CONSTANTS (8px Grid System)
// ──────────────────────────────────────────────────────────────────────────

export const SHELL_LAYOUT = {
  sidebar: {
    widthExpanded: 256, // 32 × 8px  (w-64)
    widthCollapsed: 64, // 8  × 8px  (w-16)
    transitionMs: 220,
  },
  topbar: {
    height: 56, // 7 × 8px   (h-14)
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// NAVIGATION CONFIGURATION
// ──────────────────────────────────────────────────────────────────────────

const NAV_MAIN = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { label: "Farms", href: "/dashboard/farms", icon: Leaf },
  {
    label: "Crops",
    href: "/dashboard/crops",
    icon: Sprout,
    domain: "crop" as const,
  },
  {
    label: "Livestock",
    href: "/dashboard/livestock",
    icon: Rabbit,
    domain: "livestock" as const,
  },
  {
    label: "FarmLedger",
    href: "/dashboard/ledger",
    icon: BookOpen,
    domain: "ledger" as const,
  },
  {
    label: "AgroAdvisor",
    href: "/dashboard/advisor",
    icon: CloudSun,
    domain: "advisory" as const,
  },
  { label: "Marketplace", href: "/dashboard/marketplace", icon: TrendingUp },
  { label: "Inventory", href: "/dashboard/inventory", icon: Package },
  { label: "Reports & Analytics", href: "/dashboard/reports", icon: BookOpen },
  { label: "Alerts", href: "/dashboard/alerts", icon: AlertTriangle },
] as const;

const NAV_SECONDARY = [
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Credit Profile", href: "/dashboard/credit", icon: CreditCard },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    badge: 3,
  },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

// Domain accent dots — all wired to theme tokens, dark-mode safe
const DOMAIN_STYLES = {
  crop: {
    dot: "bg-crop-foreground",
    pill: "bg-crop      text-crop-foreground",
  },
  livestock: {
    dot: "bg-livestock-foreground",
    pill: "bg-livestock text-livestock-foreground",
  },
  ledger: {
    dot: "bg-ledger-foreground",
    pill: "bg-ledger    text-ledger-foreground",
  },
  advisory: {
    dot: "bg-advisory-foreground",
    pill: "bg-advisory  text-advisory-foreground",
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// NAV ITEM
// ──────────────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  domain?: keyof typeof DOMAIN_STYLES;
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
        "group relative flex items-center rounded-lg transition-all duration-150 ease-out ",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        collapsed
          ? "justify-center px-0 py-2.5 mx-auto w-10"
          : "gap-3 px-3 py-2 text-sm font-medium ",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {/* Active pill indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-[60%] w-0.5 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
      )}

      {/* Domain accent dot (expanded mode) */}
      {domain && !collapsed && (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-[40%] w-0.5 -translate-y-1/2 rounded-r-full transition-all duration-200",
            DOMAIN_STYLES[domain].dot,
            isActive ? "opacity-0" : "opacity-0 group-hover:opacity-70",
          )}
        />
      )}

      <span
        className={cn(
          "relative flex items-center justify-center rounded-md transition-all duration-150",
          collapsed ? "h-9 w-9" : "h-4 w-4 shrink-0",
          isActive && collapsed && "bg-primary/10",
        )}
      >
        <Icon
          className={cn(
            "shrink-0 transition-transform duration-150",
            collapsed ? "h-4.5 w-4.5" : "h-4 w-4",
          )}
        />
      </span>

      {!collapsed && (
        <>
          <span className="flex-1 truncate tracking-[-0.01em] font-mono text-black">
            {label}
          </span>

          {domain && (
            <span
              className={cn(
                "ml-auto h-1.5 w-1.5 rounded-full transition-opacity duration-200",
                DOMAIN_STYLES[domain].dot,
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40",
              )}
            />
          )}

          {badge != null && badge > 0 && (
            <Badge
              variant="destructive"
              className="ml-1 h-4 min-w-[18px] px-1 text-[9px] font-semibold"
            >
              {badge > 99 ? "99+" : badge}
            </Badge>
          )}
        </>
      )}

      {/* Tooltip — collapsed mode */}
      {collapsed && (
        <span
          className={cn(
            "pointer-events-none absolute left-full z-50 ml-3",
            "flex items-center gap-1.5 whitespace-nowrap",
            "rounded-lg border border-border bg-popover px-2.5 py-1.5",
            "text-xs font-medium text-popover-foreground shadow-lg",
            "opacity-0 translate-x-1 transition-all duration-150",
            "group-hover:opacity-100 group-hover:translate-x-0",
          )}
        >
          {domain && (
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                DOMAIN_STYLES[domain].dot,
              )}
            />
          )}
          {label}
        </span>
      )}
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ──────────────────────────────────────────────────────────────────────────

function SectionLabel({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (collapsed) {
    return <div className="mx-auto my-2 h-px w-6 bg-border/60" />;
  }
  return (
    <p className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
      {label}
    </p>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// USER PROFILE
// ──────────────────────────────────────────────────────────────────────────

export function UserProfile({ collapsed }: any) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get initials
  const initials =
    user?.fullName
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  const firstName = user?.fullName?.split(" ")[0] ?? "User";
  const isPro = user?.plan === "pro" || user?.plan === "enterprise";
  const role = user?.role ?? "Farm Owner";

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  // ── Collapsed View ──
  if (collapsed) {
    return (
      <div className="relative border-t border-border/60 transition-all duration-200 px-2 py-3">
        {/* Subtle glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="flex flex-col items-center gap-2">
          {/* Avatar with tooltip-like indicator */}
          <div className="relative group">
            <Avatar className="h-9 w-9 ring-2 ring-primary/10 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary/30 group-hover:scale-105">
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500 ring-1 ring-emerald-500/20" />
          </div>

          {/* Logout button with icon only - beautiful circular button */}
          <Button
            aria-label="Sign out"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              "text-muted-foreground/50 transition-all duration-300",
              "hover:bg-gradient-to-br hover:from-destructive/10 hover:to-destructive/5",
              "hover:text-destructive hover:scale-110",
              "group relative",
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Expanded View ──
  return (
    <div className="relative border-t border-border/60 transition-all duration-200 px-3 py-3">
      {/* Subtle glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl",
              "transition-all duration-300",
              "hover:bg-muted/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              "group",
              isDropdownOpen && "bg-muted/50",
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-9 w-9 ring-2 ring-primary/10 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary/30">
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500 ring-1 ring-emerald-500/20" />
            </div>

            <div className="flex flex-1 min-w-0 flex-col items-start">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold leading-tight truncate tracking-[-0.01em] text-foreground">
                  {firstName}
                </p>
                {isPro && (
                  <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white shadow-sm shadow-amber-500/20">
                    <Sparkles className="h-2.5 w-2.5" />
                    Pro
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground/70 truncate flex items-center gap-1.5">
                <Circle className="h-1.5 w-1.5 fill-emerald-500 text-emerald-500" />
                {role}
              </p>
            </div>

            <div className="flex-shrink-0 text-muted-foreground/40 transition-transform duration-300 group-hover:text-primary/60">
              {isDropdownOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={8}
          className="w-56 rounded-xl border-muted/50 shadow-xl shadow-black/5"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span>Help & Support</span>
            </Link>
          </DropdownMenuItem>

          {isPro && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/billing" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// COLLAPSE TOGGLE
// ──────────────────────────────────────────────────────────────────────────

function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="absolute -right-3.5 top-1/2 z-50 hidden -translate-y-1/2 lg:block">
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "group/toggle relative flex h-7 w-7 items-center justify-center",
          "rounded-full border border-border bg-background shadow-md",
          "text-muted-foreground transition-all duration-200 ease-out",
          "hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-lg hover:shadow-primary/10",
          "active:scale-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 transition-transform duration-200 group-hover/toggle:translate-x-0.5" />
        ) : (
          <ChevronLeft className="h-3 w-3 transition-transform duration-200 group-hover/toggle:-translate-x-0.5" />
        )}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// LOGO
// ──────────────────────────────────────────────────────────────────────────

function SidebarLogo({
  collapsed,
  onMobileClose,
}: {
  collapsed: boolean;
  onMobileClose: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center border-b border-border/60",
        collapsed ? "justify-center px-0" : "px-4 gap-2",
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          "group flex items-center gap-2 transition-opacity duration-150 hover:opacity-75",
          collapsed && "justify-center",
        )}
      >
        {/* Icon mark */}
        <div
          className={cn(
            "flex items-center justify-center rounded-lg bg-primary transition-all duration-200",
            "group-hover:shadow-md group-hover:shadow-primary/30",
            collapsed ? "h-8 w-8" : "h-7 w-7",
          )}
        >
          <Leaf
            className={cn(
              "text-primary-foreground",
              collapsed ? "h-4 w-4" : "h-3.5 w-3.5",
            )}
          />
        </div>

        {!collapsed && (
          <span className="text-[15px] font-bold tracking-tight">
            Agro<span className="text-primary">Sense</span>
          </span>
        )}
      </Link>

      {!collapsed && (
        <button
          onClick={onMobileClose}
          aria-label="Close menu"
          className="ml-auto rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ──────────────────────────────────────────────────────────────────────────

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
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      <aside
        style={{ transitionDuration: `${SHELL_LAYOUT.sidebar.transitionMs}ms` }}
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col",
          "bg-background/98 border-r border-border/60",
          "transition-[width,transform] ease-out",
          "lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Top accent line — living gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <SidebarLogo collapsed={collapsed} onMobileClose={onMobileClose} />

        {/* Navigation scroll area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
          <div className={cn("space-y-0.5", collapsed ? "px-1.5" : "px-2")}>
            <SectionLabel label="Main" collapsed={collapsed} />
            {NAV_MAIN.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                collapsed={collapsed}
                onClick={onMobileClose}
              />
            ))}
          </div>

          <div
            className={cn("mt-2 space-y-0.5", collapsed ? "px-1.5" : "px-2")}
          >
            <SectionLabel label="Account" collapsed={collapsed} />
            {NAV_SECONDARY.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                collapsed={collapsed}
                onClick={onMobileClose}
              />
            ))}
            <NavItem
              href="/dashboard/help"
              label="Help Center"
              icon={HelpCircle}
              collapsed={collapsed}
              onClick={onMobileClose}
            />
          </div>
        </nav>

        <UserProfile collapsed={collapsed} />
        <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
      </aside>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// PAGE TITLE RESOLVER
// ──────────────────────────────────────────────────────────────────────────

function usePageTitle(): string {
  const pathname = usePathname();
  const all = [...NAV_MAIN, ...NAV_SECONDARY];
  const match = all
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname.startsWith(item.href));
  return match?.label ?? "Dashboard";
}

// ──────────────────────────────────────────────────────────────────────────
// TOPBAR
// ──────────────────────────────────────────────────────────────────────────

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const title = usePageTitle();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center",
        "border-b border-border/60 bg-background/95 backdrop-blur-sm",
        "px-4 gap-3",
      )}
    >
      {/* Mobile menu trigger */}
      <Button
        onClick={onMenuClick}
        aria-label="Open menu"
        className={cn(
          "flex items-center justify-center rounded-lg p-1.5 lg:hidden",
          "text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
        )}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h1 className="text-sm font-semibold tracking-[-0.01em] text-foreground/80 hidden sm:block">
        {title}
      </h1>

      {/* Breadcrumb separator — decorative */}
      <span className="hidden sm:block h-4 w-px bg-border/60 mx-0.5" />

      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <Button
          aria-label="Notifications"
          className={cn(
            "relative flex items-center justify-center rounded-lg p-2",
            "text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150",
          )}
        >
          <Bell className="h-4 w-4" />
          <span className={cn("absolute right-1.5 top-1.5 flex h-1.5 w-1.5")}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
          </span>
        </Button>

        {/* Divider */}
        <span className="h-5 w-px bg-border/60" />

        {/* Avatar */}
        <Avatar className="h-7 w-7 ring-1 ring-border/80 hover:ring-primary/40 transition-all duration-200 cursor-pointer">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// DASHBOARD SHELL
// ──────────────────────────────────────────────────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Hydration guard — prevents localStorage mismatch on SSR
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
    setMounted(true);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  // Prevent layout flash before hydration resolves sidebar state
  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background animate-fade-in">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
