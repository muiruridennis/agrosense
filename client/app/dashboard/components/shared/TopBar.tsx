"use client";

import { useAuth } from "@/providers/auth-provider";
import { FarmSelector } from "./FarmSelector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronDown, LogOut, Settings, Users } from "lucide-react";

interface TopBarProps {
  farmName: string;
  role: "owner" | "manager" | "worker";
}

export function TopBar({ farmName, role }: TopBarProps) {
  const { user, logout } = useAuth();

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const roleColors = {
    owner: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    manager: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    worker: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Logo + Farm Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600" />
          <span className="text-xl font-bold tracking-tight">
            Agro<span className="text-green-600">Sense</span>
          </span>
        </div>
        <FarmSelector />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Role Badge */}
        <Badge
          className={`hidden capitalize md:inline-flex ${roleColors[role]}`}
        >
          {role}
        </Badge>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-600 text-xs text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {user?.fullName?.split(" ")[0]}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge className={`mt-1 w-fit capitalize ${roleColors[role]}`}>
                  {role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Team
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
