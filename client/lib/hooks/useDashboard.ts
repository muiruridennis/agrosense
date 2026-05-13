import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  FarmSummary,
  DiseaseAlertItem,
  RecommendationItem,
  RecentRecord,
  WeatherData,
  CreateFarmInput,
  Farm,
  UpdateFarmInput,
  CreatePlotInput,
  Plot,
  UpdatePlotInput,
  Crop,
  CreateCropInput,
  UpdateCropInput,
  FarmRecord,
  CreateRecordInput,
  UpdateRecordInput,
  PaginatedResult,
} from "@/types";
import { apiClient } from "../api/client";

// ── Query keys ─────────────────────────────────────────────────────────────────
export const dashboardKeys = {
  farms: ["dashboard", "farms"] as const,
  alerts: (farmId: string) => ["dashboard", "alerts", farmId] as const,
  recommendations: (farmId: string) =>
    ["dashboard", "recommendations", farmId] as const,
  records: (farmId: string) => ["dashboard", "records", farmId] as const,
  weather: (farmId: string) => ["dashboard", "weather", farmId] as const,
  notifications: ["dashboard", "notifications"] as const,
};

// ── Farms ──────────────────────────────────────────────────────────────────────
export function useFarms() {
  return useQuery({
    queryKey: dashboardKeys.farms,
    queryFn: async () => {
      const envelope = await apiClient.get<FarmSummary[]>("/farms");
      return envelope.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export function useAlerts(farmId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.alerts(farmId ?? ""),
    queryFn: async () => {
      const envelope = await apiClient.get<DiseaseAlertItem[]>(
        `/farms/${farmId}/alerts`,
      );
      return envelope.data ?? [];
    },
    enabled: !!farmId,
    staleTime: 2 * 60 * 1000,
  });
}

// ── Recommendations ───────────────────────────────────────────────────────────
export function useRecommendations(farmId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.recommendations(farmId ?? ""),
    queryFn: async () => {
      const envelope = await apiClient.get<RecommendationItem[]>(
        `/farms/${farmId}/recommendations`,
      );
      return envelope.data ?? [];
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Recent records ────────────────────────────────────────────────────────────
export function useRecentRecords(farmId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.records(farmId ?? ""),
    queryFn: async () => {
      const envelope = await apiClient.get<{ data: RecentRecord[] }>(
        `/farms/${farmId}/records`,
        { limit: 5 },
      );
      // Records endpoint returns paginated — extract data array
      return (envelope.data as any)?.data ?? envelope.data ?? [];
    },
    enabled: !!farmId,
    staleTime: 2 * 60 * 1000,
  });
}

// ── Weather ───────────────────────────────────────────────────────────────────
export function useWeather(farmId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.weather(farmId ?? ""),
    queryFn: async () => {
      const envelope = await apiClient.get<WeatherData>(
        `/farms/${farmId}/weather`,
      );
      return envelope.data;
    },
    enabled: !!farmId,
    staleTime: 60 * 60 * 1000, // 1h — cached on server too
  });
}

// ── Unread notification count ─────────────────────────────────────────────────
export function useUnreadCount() {
  return useQuery({
    queryKey: dashboardKeys.notifications,
    queryFn: async () => {
      const envelope = await apiClient.get<number>(
        "/notifications/unread-count",
      );
      return envelope.data ?? 0;
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// ── Types ──────────────────────────────────────────────────────────────────────

// ── Query keys ─────────────────────────────────────────────────────────────────

export const farmKeys = {
  all: ["farms"] as const,
  detail: (id: string) => ["farms", id] as const,
  plots: (farmId: string) => ["farms", farmId, "plots"] as const,
};

// ── Farms ──────────────────────────────────────────────────────────────────────

export function useFarm(id: string) {
  return useQuery({
    queryKey: farmKeys.detail(id),
    queryFn: async () => {
      const env = await apiClient.get<Farm>(`/farms/${id}`);
      return env.data;
    },
    enabled: !!id,
  });
}

export function useCreateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFarmInput) => {
      const env = await apiClient.post<Farm>("/farms", data);
      return env.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.all });
      toast.success("Farm created successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to create farm");
    },
  });
}

export function useUpdateFarm(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateFarmInput) => {
      const env = await apiClient.patch<Farm>(`/farms/${id}`, data);
      return env.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.all });
      qc.invalidateQueries({ queryKey: farmKeys.detail(id) });
      toast.success("Farm updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update farm");
    },
  });
}

export function useDeleteFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/farms/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.all });
      toast.success("Farm deleted");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete farm");
    },
  });
}

// ── Plots ──────────────────────────────────────────────────────────────────────

export function usePlots(farmId: string) {
  return useQuery({
    queryKey: farmKeys.plots(farmId),
    queryFn: async () => {
      const env = await apiClient.get<Plot[]>(`/farms/${farmId}/plots`);
      return env.data ?? [];
    },
    enabled: !!farmId,
  });
}

export function useCreatePlot(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePlotInput) => {
      const env = await apiClient.post<Plot>(`/farms/${farmId}/plots`, data);
      return env.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.plots(farmId) });
      qc.invalidateQueries({ queryKey: farmKeys.detail(farmId) });
      toast.success("Plot added");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to add plot");
    },
  });
}

export function useUpdatePlot(farmId: string, plotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdatePlotInput) => {
      const env = await apiClient.patch<Plot>(
        `/farms/${farmId}/plots/${plotId}`,
        data,
      );
      return env.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.plots(farmId) });
      toast.success("Plot updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update plot");
    },
  });
}

export function useDeletePlot(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plotId: string) => {
      await apiClient.delete(`/farms/${farmId}/plots/${plotId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.plots(farmId) });
      qc.invalidateQueries({ queryKey: farmKeys.detail(farmId) });
      toast.success("Plot deleted");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete plot");
    },
  });
}

// ── Crop query keys ────────────────────────────────────────────────────────────

export const cropKeys = {
  all: ["crops"] as const,
  byFarm: (farmId: string) => ["crops", "farm", farmId] as const,
  detail: (id: string) => ["crops", id] as const,
};

// ── Crops ──────────────────────────────────────────────────────────────────────

export function useCropsByFarm(farmId: string | undefined) {
  return useQuery({
    queryKey: cropKeys.byFarm(farmId ?? ""),
    queryFn: async () => {
      const env = await apiClient.get<Crop[]>(`/farms/${farmId}/crops`);
      return env.data ?? [];
    },
    enabled: !!farmId,
  });
}

export function useCrop(id: string) {
  return useQuery({
    queryKey: cropKeys.detail(id),
    queryFn: async () => {
      const env = await apiClient.get<Crop>(`/crops/${id}`);
      return env.data;
    },
    enabled: !!id,
  });
}

export function useCreateCrop(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCropInput) => {
      const env = await apiClient.post<Crop>(`/farms/${farmId}/crops`, data);
      return env.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cropKeys.byFarm(farmId) });
      toast.success("Crop added successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to add crop");
    },
  });
}

export function useUpdateCrop(cropId: string, farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateCropInput) => {
      const env = await apiClient.patch<Crop>(`/crops/${cropId}`, data);
      return env.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cropKeys.byFarm(farmId) });
      qc.invalidateQueries({ queryKey: cropKeys.detail(cropId) });
      toast.success("Crop updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update crop");
    },
  });
}

export function useDeleteCrop(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cropId: string) => {
      await apiClient.delete(`/crops/${cropId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cropKeys.byFarm(farmId) });
      toast.success("Crop deleted");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete crop");
    },
  });
}

export const recordKeys = {
  all: ["records"] as const,
  byFarm: (farmId: string) => ["records", "farm", farmId] as const,
  detail: (id: string) => ["records", id] as const,
};

export function useRecords(farmId: string | undefined) {
  return useQuery({
    queryKey: recordKeys.byFarm(farmId ?? ""),
    queryFn: async () => {
      const envelope = await apiClient.get<PaginatedResult<FarmRecord>>(
        `/farms/${farmId}/records`,
        { limit: 100 },
      );
      return envelope.data?.data ?? [];
    },
    enabled: !!farmId,
  });
}

export function useCreateRecord(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRecordInput) => {
      const env = await apiClient.post<FarmRecord>(
        `/farms/${farmId}/records`,
        data,
      );
      return env.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordKeys.byFarm(farmId) });
      toast.success("Record logged successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to log record");
    },
  });
}

export function useUpdateRecord(recordId: string, farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateRecordInput) => {
      const env = await apiClient.patch<FarmRecord>(
        `/farms/${farmId}/records/${recordId}`,
        data,
      );
      return env.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordKeys.byFarm(farmId) });
      qc.invalidateQueries({ queryKey: recordKeys.detail(recordId) });
      toast.success("Record updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update record");
    },
  });
}

export function useDeleteRecord(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string) => {
      await apiClient.delete(`/farms/${farmId}/records/${recordId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordKeys.byFarm(farmId) });
      toast.success("Record deleted");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete record");
    },
  });
}
