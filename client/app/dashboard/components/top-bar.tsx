"use client";

import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Breadcrumb from pathname ───────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  farms: "Farms",
  crops: "Crops",
  livestock: "Livestock",
  ledger: "FarmLedger",
  advisor: "AgroAdvisor",
  alerts: "Alerts",
  credit: "Credit Profile",
  notifications: "Notifications",
  settings: "Settings",
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = LABELS[seg] ?? seg;

        return (
          <span key={seg} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-muted-foreground/40" aria-hidden="true">
                /
              </span>
            )}
            <span
              className={cn(
                "text-sm",
                isLast
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

// ── Safe initials extraction ───────────────────────────────────────────────────

const getInitials = (fullName?: string): string => {
  if (!fullName || typeof fullName !== "string") return "?";

  const parts = fullName.trim().split(/\s+/); // Split by any whitespace
  if (parts.length === 0) return "?";

  const initials = parts
    .map((part) => part[0])
    .filter((char) => char && /[A-Za-z]/.test(char)) // Only letters
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "?";
};

// ── TopBar ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  onMenuClick: () => void;
  unreadCount?: number;
}

export function TopBar({ onMenuClick, unreadCount = 0 }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const initials = getInitials(user?.fullName);

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumb — hidden on mobile */}
      <div className="hidden sm:block">
        <Breadcrumb />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global search */}
      <div className="relative hidden w-64 md:block">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search farms, crops, animals..."
          className="h-8 pl-8 text-sm"
        />
      </div>

      {/* Notification bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] px-0.5 text-[9px]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      {/* User avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground capitalize">
                {user?.role || "Role"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
