// app/dashboard/farms/[farmId]/poultry/hooks/usePoultry.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import type {
  PoultryHouse,
  Flock,
  FlockRecord,
  CreateHouseInput,
  CreateFlockInput,
  CreateRecordInput,
  UpdateHouseInput,
  UpdateFlockInput,
  UpdateRecordInput,
  BirdSaleInput,
  FlockSummary,
  FlockPerformance,
  FlockForecast,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────────────────────

const poultryKeys = {
  houses: (farmId: string) => ["poultry", "houses", farmId] as const,
  house: (houseId: string) => ["poultry", "house", houseId] as const,
  flocks: (houseId: string) => ["poultry", "flocks", houseId] as const,
  flock: (flockId: string) => ["poultry", "flock", flockId] as const,
  records: (flockId: string) => ["poultry", "records", flockId] as const,
  record: (recordId: string) => ["poultry", "record", recordId] as const,
  summary: (flockId: string) => ["poultry", "summary", flockId] as const,
  performance: (flockId: string) => ["poultry", "performance", flockId] as const,
  forecast: (flockId: string) => ["poultry", "forecast", flockId] as const,
  todayRecord: (flockId: string) => ["poultry", "today-record", flockId] as const,
  pendingReview: (flockId: string) => ["poultry", "pending-review", flockId] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// HOUSES
// ─────────────────────────────────────────────────────────────────────────────

export function usePoultryHouses(farmId: string) {
  return useQuery({
    queryKey: poultryKeys.houses(farmId),
    queryFn: async () => {
      const envelope = await apiClient.get<PoultryHouse[]>(
        `/farms/${farmId}/poultry/houses`
      );
      return envelope.data || [];
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePoultryHouse(houseId: string) {
  return useQuery({
    queryKey: poultryKeys.house(houseId),
    queryFn: async () => {
      const envelope = await apiClient.get<PoultryHouse>(
        `/poultry/houses/${houseId}`
      );
      return envelope.data;
    },
    enabled: !!houseId,
  });
}

export function useCreatePoultryHouse(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHouseInput) => {
      const envelope = await apiClient.post<PoultryHouse>(
        `/farms/${farmId}/poultry/houses`,
        data
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.houses(farmId) });
      toast.success("Poultry house created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create poultry house");
    },
  });
}

export function useUpdatePoultryHouse(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ houseId, data }: { houseId: string; data: UpdateHouseInput }) => {
      const envelope = await apiClient.patch<PoultryHouse>(`/poultry/houses/${houseId}`, data);
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.houses(farmId) });
      toast.success("Poultry house updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update poultry house");
    },
  });
}

export function useDeletePoultryHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (houseId: string) => {
      await apiClient.delete(`/poultry/houses/${houseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poultry", "houses"] });
      toast.success("Poultry house deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete poultry house");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOCKS
// ─────────────────────────────────────────────────────────────────────────────

export function useFlocks(houseId: string) {
  return useQuery({
    queryKey: poultryKeys.flocks(houseId),
    queryFn: async () => {
      const envelope = await apiClient.get<Flock[]>(`/poultry/houses/${houseId}/flocks`);
      return envelope.data || [];
    },
    enabled: !!houseId,
  });
}

export function useFlock(farmId: string, flockId: string) {
  return useQuery({
    queryKey: poultryKeys.flock(flockId),
    queryFn: async () => {
      const envelope = await apiClient.get<Flock>(
        `/farms/${farmId}/poultry/flocks/${flockId}`
      );
      return envelope.data;
    },
    enabled: !!farmId && !!flockId,
  });
}

export function useCreateFlock(houseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFlockInput) => {
      const envelope = await apiClient.post<Flock>(
        `/poultry/houses/${houseId}/flocks`,
        data
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.flocks(houseId) });
      queryClient.invalidateQueries({ queryKey: poultryKeys.house(houseId) });
      toast.success("Flock created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create flock");
    },
  });
}

export function useUpdateFlock(farmId: string, flockId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateFlockInput) => {
      const envelope = await apiClient.patch<Flock>(
        `/farms/${farmId}/poultry/flocks/${flockId}`,
        data
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.flock(flockId) });
      toast.success("Flock updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update flock");
    },
  });
}

export function useDeleteFlock(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flockId: string) => {
      await apiClient.delete(`/farms/${farmId}/poultry/flocks/${flockId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poultry", "flocks"] });
      queryClient.invalidateQueries({ queryKey: ["poultry", "houses"] });
      toast.success("Flock deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete flock");
    },
  });
}

export function useCloseFlock(farmId: string, flockId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const envelope = await apiClient.patch<{ flock: Flock; closureReport: any }>(
        `/farms/${farmId}/poultry/flocks/${flockId}/close`
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.flock(flockId) });
      queryClient.invalidateQueries({ queryKey: poultryKeys.summary(flockId) });
      queryClient.invalidateQueries({ queryKey: poultryKeys.performance(flockId) });
      toast.success("Flock closed successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to close flock");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOCK SUMMARY & ANALYTICS (NEW - TAPPING INTO BACKEND INTELLIGENCE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET FLOCK SUMMARY — Executive intelligence dashboard
 * Returns: Biological, Financial, Operational, Predictive metrics
 */
export function useFlockSummary(farmId: string, flockId: string) {
  return useQuery({
    queryKey: poultryKeys.summary(flockId),
    queryFn: async () => {
      const envelope = await apiClient.get<FlockSummary>(
        `/farms/${farmId}/poultry/flocks/${flockId}/summary`
      );
      return envelope.data;
    },
    enabled: !!farmId && !!flockId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * GET FLOCK PERFORMANCE — Benchmarking against industry standards
 * Returns: Mortality, Production, FCR status vs targets
 */
export function useFlockPerformance(farmId: string, flockId: string) {
  return useQuery({
    queryKey: poultryKeys.performance(flockId),
    queryFn: async () => {
      const envelope = await apiClient.get<FlockPerformance>(
        `/farms/${farmId}/poultry/flocks/${flockId}/performance`
      );
      return envelope.data;
    },
    enabled: !!farmId && !!flockId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * GET FLOCK FORECAST — Predictive analytics
 * Returns: Projected harvest date, feed costs, mortality, remaining birds
 */
export function useFlockForecast(farmId: string, flockId: string) {
  return useQuery({
    queryKey: poultryKeys.forecast(flockId),
    queryFn: async () => {
      const envelope = await apiClient.get<any>(
        `/farms/${farmId}/poultry/flocks/${flockId}/forecast`
      );
      return envelope.data;
    },
    enabled: !!farmId && !!flockId,
    staleTime: 10 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORDS
// ─────────────────────────────────────────────────────────────────────────────

// app/dashboard/farms/[farmId]/poultry/hooks/usePoultry.ts

// Update the useFlockRecords hook to handle the { records, total } response
export function useFlockRecords(farmId: string, flockId: string, limit = 100) {
  return useQuery({
    queryKey: [...poultryKeys.records(flockId), limit],
    queryFn: async () => {
      const envelope = await apiClient.get<{ records: FlockRecord[]; total: number }>(
        `/farms/${farmId}/poultry/flocks/${flockId}/records`,
        { limit }
      );
      // envelope.data is { records: [], total: 0 }
      return envelope.data?.records || [];
    },
    enabled: !!farmId && !!flockId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTodayRecord(farmId: string, flockId: string) {
  return useQuery({
    queryKey: poultryKeys.todayRecord(flockId),
    queryFn: async () => {
      const envelope = await apiClient.get<{ exists: boolean; record: FlockRecord | null; status: string | null }>(
        `/farms/${farmId}/poultry/flocks/${flockId}/records/today`
      );
      return envelope.data;
    },
    enabled: !!farmId && !!flockId,
    staleTime: 60 * 1000, // Refresh every minute
  });
}

export function usePendingReviewRecords(farmId: string, flockId: string, page = 1, limit = 30) {
  return useQuery({
    queryKey: [...poultryKeys.pendingReview(flockId), page, limit],
    queryFn: async () => {
      const envelope = await apiClient.get<{ records: FlockRecord[]; total: number }>(
        `/farms/${farmId}/poultry/flocks/${flockId}/records/pending-review`,
        { page, limit }
      );
      return envelope.data;
    },
    enabled: !!farmId && !!flockId,
  });
}

export function useFlockRecord(recordId: string) {
  return useQuery({
    queryKey: poultryKeys.record(recordId),
    queryFn: async () => {
      const envelope = await apiClient.get<FlockRecord>(`/poultry/records/${recordId}`);
      return envelope.data;
    },
    enabled: !!recordId,
  });
}

export function useSubmitFlockRecord(farmId: string, flockId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecordInput) => {
      const envelope = await apiClient.post<FlockRecord>(
        `/farms/${farmId}/poultry/flocks/${flockId}/records`,
        data
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.records(flockId) });
      queryClient.invalidateQueries({ queryKey: poultryKeys.flock(flockId) });
      queryClient.invalidateQueries({ queryKey: poultryKeys.todayRecord(flockId) });
      queryClient.invalidateQueries({ queryKey: poultryKeys.summary(flockId) });
      toast.success("Record submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit record");
    },
  });
}

// app/dashboard/farms/[farmId]/poultry/hooks/usePoultry.ts

// app/dashboard/farms/[farmId]/poultry/hooks/usePoultry.ts

export function useUpdateFlockRecord(farmId: string, recordId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, data }: { recordId: string; data: UpdateRecordInput }) => {
      const envelope = await apiClient.patch<FlockRecord>(`/farms/${farmId}/poultry/records/${recordId}`, data);
      return envelope.data;
    },
    onSuccess: (updatedRecord) => {
      // ✅ Invalidate the single record cache
      queryClient.invalidateQueries({ queryKey: poultryKeys.record(recordId) });
      
      // ✅ Invalidate the records list for the flock (so the table updates)
      // We need the flockId from the updated record
      if (updatedRecord?.flockId) {
        queryClient.invalidateQueries({ 
          queryKey: poultryKeys.records(updatedRecord.flockId) 
        });
      }
      
      toast.success("Record updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update record");
    },
  });
}

export function useDeleteFlockRecord(farmId: string, recordId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/farms/${farmId}/poultry/records/${recordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poultry", "records"] });
      toast.success("Record deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete record");
    },
  });
}

export function useSubmitRecord(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      const envelope = await apiClient.patch<FlockRecord>(
        `/farms/${farmId}/poultry/records/${recordId}/submit`
      );
      return envelope.data;
    },
    onSuccess: (_, recordId) => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.record(recordId) });
      queryClient.invalidateQueries({ queryKey: ["poultry", "pending-review"] });
      toast.success("Record submitted for review");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit record");
    },
  });
}

export function useReviewRecord(farmId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, data }: { recordId: string; data: { status: 'reviewed' | 'flagged'; reviewNote?: string } }) => {
      const envelope = await apiClient.patch<FlockRecord>(
        `/farms/${farmId}/poultry/records/${recordId}/review`,
        data
      );
      return envelope.data;
    },
    onSuccess: (_, { recordId }) => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.record(recordId) });
      queryClient.invalidateQueries({ queryKey: ["poultry", "pending-review"] });
      toast.success("Record reviewed successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to review record");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────────────────────────────────────

export function useRecordBirdSale(farmId: string, flockId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BirdSaleInput) => {
      const envelope = await apiClient.post<Flock>(
        `/farms/${farmId}/poultry/flocks/${flockId}/sales`,
        data
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poultryKeys.flock(flockId) });
      queryClient.invalidateQueries({ queryKey: poultryKeys.records(flockId) });
      queryClient.invalidateQueries({ queryKey: poultryKeys.summary(flockId) });
      toast.success("Sale recorded successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to record sale");
    },
  });
}