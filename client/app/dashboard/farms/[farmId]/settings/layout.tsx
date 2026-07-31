"use client";

import { useParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  DollarSign,
  Bell,
  Users,
  Plug,
  Building2,
  Shield,
  Lock,
} from "lucide-react";
import { useFarmRole } from "@/providers/FarmRoleContext";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { farmId } = useParams();
  const pathname = usePathname();
  
  // Get user's role for this farm
  const { role, isOwner, isManager, isWorker } = useFarmRole();

  // Determine which tab is active
  const getActiveTab = () => {
    if (pathname?.includes("/pricing")) return "pricing";
    if (pathname?.includes("/notifications")) return "notifications";
    if (pathname?.includes("/team")) return "team";
    if (pathname?.includes("/integrations")) return "integrations";
    return "general";
  };

  // Define all possible tabs with permissions
  const allTabs = [
    {
      id: "general",
      label: "General",
      icon: Building2,
      href: `/dashboard/farms/${farmId}/settings`,
      requiredRole: "all", // Everyone can see
      description: "Farm details and basic settings",
    },
    {
      id: "pricing",
      label: "Pricing",
      icon: DollarSign,
      href: `/dashboard/farms/${farmId}/settings/pricing`,
      requiredRole: "all", // Everyone can see, but actions are permissioned
      description: "Manage pricing versions and history",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      href: `/dashboard/farms/${farmId}/settings/notifications`,
      requiredRole: "all", // Everyone can see their own notifications
      description: "Configure notification preferences",
    },
    {
      id: "team",
      label: "Team",
      icon: Users,
      href: `/dashboard/farms/${farmId}/settings/team`,
      requiredRole: "manager_or_owner", // Only managers and owners
      description: "Manage team members and roles",
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: Plug,
      href: `/dashboard/farms/${farmId}/settings/integrations`,
      requiredRole: "owner", // Only owners
      description: "Connect external services",
    },
  ];

  // Filter tabs based on user role
  const visibleTabs = allTabs.filter((tab) => {
    if (tab.requiredRole === "all") return true;
    if (tab.requiredRole === "manager_or_owner") return isManager || isOwner;
    if (tab.requiredRole === "owner") return isOwner;
    return true;
  });

  // Check if a tab is accessible (for disabled styling)
  const isTabAccessible = (tab: typeof allTabs[0]) => {
    if (tab.requiredRole === "all") return true;
    if (tab.requiredRole === "manager_or_owner") return isManager || isOwner;
    if (tab.requiredRole === "owner") return isOwner;
    return true;
  };

  // Get role badge label
  const getRoleLabel = () => {
    if (isOwner) return "Owner";
    if (isManager) return "Manager";
    if (isWorker) return "Worker";
    return "Viewer";
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Farm Settings
            <Badge variant="outline" className="text-xs font-normal gap-1">
              <Shield className="h-3 w-3" />
              {getRoleLabel()}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your farm's configuration, pricing, team, and integrations
          </p>
        </div>
        
        {/* Role info */}
        {!isOwner && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">
            <Lock className="h-4 w-4" />
            <span>
              {isManager 
                ? "You have manager access - some settings are owner-only"
                : isWorker
                ? "You have worker access - some settings are restricted"
                : "View-only access"
              }
            </span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={getActiveTab()} className="w-full">
        <TabsList className="flex flex-wrap w-full h-auto gap-1 bg-muted/50 p-1">
          {allTabs.map((tab) => {
            const isVisible = visibleTabs.some((t) => t.id === tab.id);
            const isAccessible = isTabAccessible(tab);
            
            // If tab is not visible, don't render it
            if (!isVisible) return null;

            // If tab is visible but not accessible, show it as disabled with tooltip
            const tabContent = (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`
                  w-full gap-2 py-2 px-3 
                  data-[state=active]:bg-primary 
                  data-[state=active]:text-primary-foreground
                  ${!isAccessible ? 'opacity-60 cursor-not-allowed' : ''}
                  flex-1 min-w-[80px]
                `}
                disabled={!isAccessible}
                asChild={false}
              >
                <Link 
                  href={tab.href} 
                  className="flex items-center gap-2 w-full justify-center"
                  onClick={(e) => {
                    if (!isAccessible) {
                      e.preventDefault();
                    }
                  }}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {!isAccessible && (
                    <Lock className="h-3 w-3 ml-1 opacity-60" />
                  )}
                </Link>
              </TabsTrigger>
            );

            // If tab is not accessible, wrap with tooltip
            if (!isAccessible) {
              return (
                <TooltipProvider key={tab.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1 min-w-[80px]">
                        {tabContent}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {tab.requiredRole === "owner" 
                          ? "Only the farm owner can access this"
                          : "Manager or owner access required"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return tabContent;
          })}
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="mt-6">{children}</div>
    </div>
  );
}