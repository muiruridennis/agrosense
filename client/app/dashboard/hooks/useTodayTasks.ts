import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export function useTodayTasks(farmId: string, workerId?: string) {
  return useQuery({
    queryKey: ["tasks", "today", farmId, workerId],
    queryFn: async () => {
      const params = workerId ? { assignedTo: workerId } : {};
      const res = await apiClient.get(`/farms/${farmId}/tasks/today`, { params });
      return res.data || [];
    },
    enabled: !!farmId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}