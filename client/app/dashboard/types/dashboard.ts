import { FarmMemberRole } from "@/types";

export interface DashboardTask {
  id: string;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  location?: string;
  estimatedMinutes?: number;
  dueTime?: string;
  assignedTo: string;
  createdAt: string;
}

export interface DashboardActivity {
  id: string;
  type: "task_completed" | "alert_raised" | "inventory_updated" | "transaction";
  description: string;
  userName: string;
  userId: string;
  createdAt: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  forecast?: {
    high: number;
    low: number;
    condition: string;
  };
}

export interface RolePermissions {
  canViewFinancials: boolean;
  canEditInventory: boolean;
  canAssignTasks: boolean;
  canManageTeam: boolean;
  canViewReports: boolean;
}

export const getRolePermissions = (role: FarmMemberRole): RolePermissions => {
  switch (role) {
    case FarmMemberRole.OWNER:
      return {
        canViewFinancials: true,
        canEditInventory: true,
        canAssignTasks: true,
        canManageTeam: true,
        canViewReports: true,
      };
    case FarmMemberRole.MANAGER:
      return {
        canViewFinancials: true,
        canEditInventory: true,
        canAssignTasks: true,
        canManageTeam: false,
        canViewReports: true,
      };
    case FarmMemberRole.WORKER:
      return {
        canViewFinancials: false,
        canEditInventory: false,
        canAssignTasks: false,
        canManageTeam: false,
        canViewReports: false,
      };
    default:
      return {
        canViewFinancials: false,
        canEditInventory: false,
        canAssignTasks: false,
        canManageTeam: false,
        canViewReports: false,
      };
  }
};