// app/dashboard/farms/[farmId]/settings/hooks/usePricing.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { CreatePricingInput, PricingTier, PricingHistory, PricingHistoryResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────────────────────

const pricingKeys = {
  all: ["pricing"] as const,
  active: (farmId: string) => [...pricingKeys.all, "active", farmId] as const,
  history: (farmId: string) => [...pricingKeys.all, "history", farmId] as const,
  detail: (tierId: string) => [...pricingKeys.all, "detail", tierId] as const,
  versions: (farmId: string) => [...pricingKeys.all, "versions", farmId] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get active pricing for a farm
 */
export function useActivePricing(farmId: string) {
  return useQuery({
    queryKey: pricingKeys.active(farmId),
    queryFn: async () => {
      const envelope = await apiClient.get<PricingTier>(`/farms/${farmId}/pricing/current`);
      return envelope.data;
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get pricing history (events) for a farm with pagination
 */
export function usePricingHistory(farmId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: [...pricingKeys.history(farmId), page, limit],
    queryFn: async () => {
      const envelope = await apiClient.get<PricingHistoryResponse>(
        `/farms/${farmId}/pricing/history`,
        { page, limit }
      );
      
      return {
        data: envelope.data?.data || [],
        total: envelope.data?.pagination?.total || 0,
        page: envelope.data?.pagination?.page || 1,
        limit: envelope.data?.pagination?.limit || 10,
        pages: envelope.data?.pagination?.pages || 0,
      };
    },
    enabled: !!farmId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get all pricing versions (tiers) for a farm
 */
export function usePricingVersions(farmId: string) {
  return useQuery({
    queryKey: pricingKeys.versions(farmId),
    queryFn: async () => {
      const envelope = await apiClient.get<{
        data: PricingTier[];
        meta: {
          totalVersions: number;
          activeVersion: number | null;
          archivedCount: number;
        };
      }>(`/farms/${farmId}/pricing/versions`);
      return envelope.data;
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get a single pricing tier by ID
 */
export function usePricingTier(tierId: string) {
  return useQuery({
    queryKey: pricingKeys.detail(tierId),
    queryFn: async () => {
      const envelope = await apiClient.get<PricingTier>(`/pricing/${tierId}`);
      return envelope.data;
    },
    enabled: !!tierId,
  });
}

/**
 * Create a new pricing tier
 */
export function useCreatePricingTier(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePricingInput) => {
      const envelope = await apiClient.post<PricingTier>(`/farms/${farmId}/pricing`, data);
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.history(farmId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.active(farmId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.versions(farmId) });
      toast.success("Pricing tier created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create pricing tier");
    },
  });
}

/**
 * Archive a pricing tier
 */
export function useArchivePricingTier(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tierId, reason }: { tierId: string; reason?: string }) => {
      const envelope = await apiClient.patch<PricingTier>(
        `/farms/${farmId}/pricing/${tierId}/archive`,
        { reason }
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.history(farmId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.active(farmId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.versions(farmId) });
      toast.success("Pricing tier archived");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to archive pricing tier");
    },
  });
}

/**
 * Restore a pricing tier
 */
export function useRestorePricingTier(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tierId, reason }: { tierId: string; reason?: string }) => {
      const envelope = await apiClient.patch<PricingTier>(
        `/farms/${farmId}/pricing/${tierId}/restore`,
        { reason }
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.history(farmId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.active(farmId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.versions(farmId) });
      toast.success("Pricing tier restored");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to restore pricing tier");
    },
  });
}

/**
 * Suspend a pricing tier
 */
export function useSuspendPricingTier(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tierId, reason }: { tierId: string; reason: string }) => {
      const envelope = await apiClient.patch<PricingTier>(
        `/farms/${farmId}/pricing/${tierId}/suspend`,
        { reason }
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.history(farmId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.active(farmId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.versions(farmId) });
      toast.success("Pricing tier suspended");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to suspend pricing tier");
    },
  });
}