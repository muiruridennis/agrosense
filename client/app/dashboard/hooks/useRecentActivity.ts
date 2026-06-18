import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export function useRecentActivity(farmId: string, limit = 10) {
  return useQuery({
    queryKey: ["activity", "recent", farmId, limit],
    queryFn: async () => {
      const res = await apiClient.get(`/farms/${farmId}/activity/recent`, {
        params: { limit },
      });
      return res.data || [];
    },
    enabled: !!farmId,
    staleTime: 30 * 1000,
  });
}