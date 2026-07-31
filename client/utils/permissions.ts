// utils/permissions.ts
import { FarmMemberRole } from "@/types";

export interface FlockPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canViewFinancials: boolean;
  canClose: boolean;
}

export function getFlockPermissions(role: FarmMemberRole): FlockPermissions {
  const isOwner = role === FarmMemberRole.OWNER;
  const isManager = role === FarmMemberRole.MANAGER;
  const isWorker = role === FarmMemberRole.WORKER;

  return {
    canView: true, // Everyone can view
    canCreate: isWorker || isManager || isOwner, // Everyone can create records
    canEdit: isWorker || isManager, // Workers can edit own drafts
    canDelete: isOwner, // Only owners can delete
    canSubmit: isWorker || isManager, // Workers and managers can submit
    canReview: isManager || isOwner, // Only managers/owners can review
    canViewFinancials: isManager || isOwner, // Only managers/owners see financials
    canClose: isManager || isOwner, // Only managers/owners can close flocks
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD-SPECIFIC PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export function canEditRecord(
  record: { status: string; submittedById: string },
  userId: string,
  role: FarmMemberRole
): boolean {
  const isOwner = role === FarmMemberRole.OWNER;
  
  // Owner can edit any record
  if (isOwner) return true;
  
  // Only the creator can edit draft or flagged records
  return (
    (record.status === "draft" || record.status === "flagged") &&
    record.submittedById === userId
  );
}

export function canSubmitRecord(
  record: { status: string; submittedById: string },
  userId: string
): boolean {
  // Only the creator can submit a draft record
  return record.status === "draft" && record.submittedById === userId;
}

export function canReviewRecord(
  record: { status: string },
  role: FarmMemberRole
): boolean {
  // Only managers and owners can review submitted records
  const isManager = role === FarmMemberRole.MANAGER || role === FarmMemberRole.OWNER;
  return record.status === "submitted" && isManager;
}

export function canDeleteRecord(
  record: { status: string; submittedById: string },
  userId: string,
  role: FarmMemberRole
): boolean {
  const isOwner = role === FarmMemberRole.OWNER;
  
  // Owner can delete any record
  if (isOwner) return true;
  
  // Others can only delete their own draft records
  return record.status === "draft" && record.submittedById === userId;
}