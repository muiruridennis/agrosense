"use client";

import { createContext, useContext, ReactNode } from "react";
import { FarmMemberRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FarmRoleContextValue {
  role: FarmMemberRole;
  farmId: string;
  isOwner: boolean;
  isManager: boolean;
  isWorker: boolean;
  canViewFinancials: boolean;
  canReviewRecords: boolean;
  canEditRecords: boolean;
  canDeleteRecords: boolean;
  canCloseFlock: boolean;
  canManageTeam: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS HELPER
// ─────────────────────────────────────────────────────────────────────────────

const getPermissions = (role: FarmMemberRole) => {
  const isOwner = role === FarmMemberRole.OWNER;
  const isManager = role === FarmMemberRole.MANAGER;
  const isWorker = role === FarmMemberRole.WORKER;
  
  return {
    isOwner,
    isManager,
    isWorker,
    canViewFinancials: isOwner || isManager,
    canReviewRecords: isOwner || isManager,
    canEditRecords: isWorker || isManager, // Worker can edit own drafts
    canDeleteRecords: isOwner,             // Only owner can delete
    canCloseFlock: isOwner || isManager,
    canManageTeam: isOwner || isManager,
    canViewAllRecords: isOwner || isManager,
    canSubmitRecords: isWorker || isManager,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const FarmRoleContext = createContext<FarmRoleContextValue | null>(null);

export function FarmRoleProvider({
  children,
  role,
  farmId,
}: {
  children: ReactNode;
  role: FarmMemberRole;
  farmId: string;
}) {
  const permissions = getPermissions(role);

  const value: FarmRoleContextValue = {
    role,
    farmId,
    isOwner: permissions.isOwner,
    isManager: permissions.isManager,
    isWorker: permissions.isWorker,
    canViewFinancials: permissions.canViewFinancials,
    canReviewRecords: permissions.canReviewRecords,
    canEditRecords: permissions.canEditRecords,
    canDeleteRecords: permissions.canDeleteRecords,
    canCloseFlock: permissions.canCloseFlock,
    canManageTeam: permissions.canManageTeam,
  };

  return (
    <FarmRoleContext.Provider value={value}>
      {children}
    </FarmRoleContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useFarmRole() {
  const context = useContext(FarmRoleContext);
  
  if (!context) {
    throw new Error(
      "useFarmRole must be used within a FarmRoleProvider. " +
      "Make sure your farm layout wraps children with FarmRoleProvider."
    );
  }
  
  return context;
}