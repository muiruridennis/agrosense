// app/dashboard/farms/[farmId]/settings/hooks/useSettingsPermissions.ts
"use client";

import { useFarm } from "@/lib/hooks/useDashboard";
import { useFarmRole } from "@/providers/FarmRoleContext";

export enum SettingAccessLevel {
  OWNER_ONLY = "owner_only",
  MANAGER_OR_OWNER = "manager_owner",
  WORKER_OR_MANAGER = "worker_manager",
  EVERYONE = "everyone",
  READ_ONLY = "read_only",
}

export interface SettingPermission {
  canView: boolean;
  canEdit: boolean;
  requiresConfirmation: boolean;
  requiresReason: boolean;
  warning?: string;
}

export function useSettingsPermissions(farmId: string) {
  const {
    role,
    isOwner,
    isManager,
    isWorker,
    canManageTeam,
    canViewFinancials,
  } = useFarmRole();

  const { data: farm, isLoading } = useFarm(farmId);

  const checkPermission = (level: SettingAccessLevel): SettingPermission => {
    // Owner has all permissions
    if (isOwner) {
      return {
        canView: true,
        canEdit: true,
        requiresConfirmation: level === SettingAccessLevel.OWNER_ONLY,
        requiresReason: level === SettingAccessLevel.OWNER_ONLY,
        warning:
          level === SettingAccessLevel.OWNER_ONLY
            ? "This change is irreversible and will affect all farm operations"
            : undefined,
      };
    }

    // Manager permissions
    if (isManager) {
      const canEdit = [
        SettingAccessLevel.MANAGER_OR_OWNER,
        SettingAccessLevel.WORKER_OR_MANAGER,
        SettingAccessLevel.EVERYONE,
      ].includes(level);

      return {
        canView: true,
        canEdit,
        requiresConfirmation: false,
        requiresReason: false,
        warning: canEdit
          ? undefined
          : "You do not have permission to change this setting",
      };
    }

    // Worker permissions
    if (isWorker) {
      const canEdit = [
        SettingAccessLevel.WORKER_OR_MANAGER,
        SettingAccessLevel.EVERYONE,
      ].includes(level);

      return {
        canView: true,
        canEdit,
        requiresConfirmation: false,
        requiresReason: false,
        warning: canEdit
          ? undefined
          : "You do not have permission to change this setting",
      };
    }

    // Default - read only
    return {
      canView: false,
      canEdit: false,
      requiresConfirmation: false,
      requiresReason: false,
      warning: "You do not have access to this setting",
    };
  };

  // Group-level permissions for UI
  const canManageGeneralSettings = checkPermission(
    SettingAccessLevel.MANAGER_OR_OWNER,
  ).canEdit;
  const canManageOperationalSettings = checkPermission(
    SettingAccessLevel.OWNER_ONLY,
  ).canEdit;
  const canViewFinancialSettings = canViewFinancials;

  return {
    role,
    isOwner,
    isManager,
    isWorker,
    checkPermission,
    canManageGeneralSettings,
    canManageOperationalSettings,
    canManageTeam,
    canViewFinancialSettings,
    isLoading,
  };
}
