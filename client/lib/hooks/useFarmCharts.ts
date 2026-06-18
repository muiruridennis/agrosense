// lib/hooks/useFarmCharts.ts - Fix error handling
import { useQueries } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { PoultryRecord } from "@/types";

export type TimeRange = "week" | "month" | "year";

function getDateRange(range: TimeRange) {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatDateForChart(dateStr: string, range: TimeRange) {
  const date = new Date(dateStr);
  if (range === "year") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function aggregateDaily(
  revenueData: any[],
  costsData: any[],
  range: TimeRange,
) {
  const dailyMap = new Map();

  // Process revenue
  (revenueData || []).forEach((r: any) => {
    const date = r.soldDate ? new Date(r.soldDate) : null;
    if (date) {
      const formattedDate = formatDateForChart(r.soldDate, range);
      const existing = dailyMap.get(formattedDate) || {
        revenue: 0,
        costs: 0,
        rawDate: date,
      };
      existing.revenue += parseFloat(r.totalRevenue) || 0;
      dailyMap.set(formattedDate, existing);
    }
  });

  // Process costs
  (costsData || []).forEach((c: any) => {
    const date = c.incurredDate ? new Date(c.incurredDate) : null;
    if (date) {
      const formattedDate = formatDateForChart(c.incurredDate, range);
      const existing = dailyMap.get(formattedDate) || {
        revenue: 0,
        costs: 0,
        rawDate: date,
      };
      existing.costs += parseFloat(c.totalCost) || 0;
      dailyMap.set(formattedDate, existing);
    }
  });

  // Sort by date
  const sortedDates = Array.from(dailyMap.entries())
    .sort((a, b) => a[1].rawDate.getTime() - b[1].rawDate.getTime())
    .map(([date]) => date);

  return sortedDates.map((date) => ({
    date,
    revenue: dailyMap.get(date)?.revenue || 0,
    costs: dailyMap.get(date)?.costs || 0,
    profit:
      (dailyMap.get(date)?.revenue || 0) - (dailyMap.get(date)?.costs || 0),
  }));
}

function aggregateDailyProduction(records: any[]) {
  const dailyMap = new Map();

  (records || []).forEach((r: any) => {
    if (r.recordDate) {
      const date = new Date(r.recordDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const existing = dailyMap.get(date) || { eggs: 0, feedKg: 0 };
      existing.eggs += r.eggsProduced || 0;
      existing.feedKg += r.feedKg || 0;
      dailyMap.set(date, existing);
    }
  });

  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dates.push(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }

  const data = dates.map((date) => ({
    date,
    eggs: dailyMap.get(date)?.eggs || 0,
    feedKg: dailyMap.get(date)?.feedKg || 0,
  }));

  const totalEggs = data.reduce((sum, d) => sum + d.eggs, 0);
  const avgDaily = totalEggs / 7;

  return { daily: data, avgDaily, totalEggs };
}

type RecordsResponse = {
  records: PoultryRecord[];
  total: number;
};

async function getFlockRecords(farmId: string, range: TimeRange) {
  const dateRange = getDateRange(range);

  const housesRes =
    await apiClient.get<House[]>(`/farms/${farmId}/poultry/houses`);

  const houses = housesRes.data;

  const allRecords: PoultryRecord[] = [];

  for (const house of houses) {
    const flocksRes =
      await apiClient.get<Flock[]>(
        `/poultry/houses/${house.id}/flocks`
      );

    const flocks = flocksRes.data;

    for (const flock of flocks) {
      const recordsRes =
        await apiClient.get<RecordsResponse>(
          `/poultry/flocks/${flock.id}/records`,
          {
            startDate: dateRange.start,
            endDate: dateRange.end,
          }
        );

      allRecords.push(...recordsRes.data.records);
    }
  }

  return allRecords;
}

export function useFarmCharts(farmId: string, range: TimeRange = "month") {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const dateRange = getDateRange(range);

  const results = useQueries({
    queries: [
      // Chart 1: Cash In vs Cash Out
      {
        queryKey: ["chart", "cashflow", farmId, currentPeriod, range],
        queryFn: async () => {
          try {
            const [summary, revenue, costs] = await Promise.all([
              apiClient.get(
                `/finance/farms/${farmId}/summary/${currentPeriod}`,
              ),
              apiClient.get(
                `/finance/farms/${farmId}/revenue?startDate=${dateRange.start}&endDate=${dateRange.end}`,
              ),
              apiClient.get(
                `/finance/farms/${farmId}/costs?startDate=${dateRange.start}&endDate=${dateRange.end}`,
              ),
            ]);

            const totalRevenue = summary.data?.totalRevenue
              ? parseFloat(summary.data.totalRevenue)
              : 0;
            const totalCosts = summary.data?.totalCosts
              ? parseFloat(summary.data.totalCosts)
              : 0;
            const grossProfit = summary.data?.grossProfit
              ? parseFloat(summary.data.grossProfit)
              : 0;
            const profitMargin = summary.data?.profitMargin
              ? parseFloat(summary.data.profitMargin)
              : 0;

            return {
              monthly: {
                revenue: totalRevenue,
                costs: totalCosts,
                profit: grossProfit,
                margin: profitMargin,
              },
              daily: aggregateDaily(
                revenue.data || [],
                costs.data || [],
                range,
              ),
            };
          } catch (error) {
            console.error("Cashflow chart error:", error);
            // Return empty data structure instead of throwing
            return {
              monthly: { revenue: 0, costs: 0, profit: 0, margin: 0 },
              daily: [],
            };
          }
        },
        enabled: !!farmId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },

      // Chart 2: Production
      {
        queryKey: ["chart", "production", farmId, range],
        queryFn: async () => {
          try {
            const records = await getFlockRecords(farmId, range);
            if (range === "year") {
              return aggregateMonthlyProduction(records, range);
            }
            return aggregateDailyProduction(records);
          } catch (error) {
            console.error("Production chart error:", error);
            return { daily: [], avgDaily: 0, totalEggs: 0 };
          }
        },
        enabled: !!farmId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },
      {
        queryKey: ["chart", "mortality", farmId, range],
        queryFn: async () => {
          try {
            const records = await getFlockRecords(farmId, range);
            return calculateWeeklyMortality(records, range);
          } catch (error) {
            console.error("Mortality chart error:", error);
            return { daily: [], avgRate: 0, totalDeaths: 0 };
          }
        },
        enabled: !!farmId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },
    ],
  });

  // Individual loading and error states per query
  const cashflowQuery = results[0];
  const productionQuery = results[1];
  const mortalityQuery = results[2];

  return {
    cashflow: cashflowQuery.data,
    production: productionQuery.data,
      mortality: mortalityQuery.data,

    isLoading: cashflowQuery.isLoading || productionQuery.isLoading,
    isCashflowError: cashflowQuery.isError,
    isProductionError: productionQuery.isError,
    isMortalityError: mortalityQuery.isError,
    refetch: () => {
      cashflowQuery.refetch();
      productionQuery.refetch();
    },
  };
}

// Helper function for monthly aggregation (add this)
function aggregateMonthlyProduction(records: any[], range: TimeRange) {
  const monthlyMap = new Map();

  (records || []).forEach((r: any) => {
    if (r.recordDate) {
      const date = new Date(r.recordDate);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const existing = monthlyMap.get(monthKey) || {
        eggs: 0,
        feedKg: 0,
        month: monthKey,
      };
      existing.eggs += r.eggsProduced || 0;
      existing.feedKg += r.feedKg || 0;
      monthlyMap.set(monthKey, existing);
    }
  });

  const sortedMonths = Array.from(monthlyMap.entries())
    .sort((a, b) => {
      const dateA = new Date(a[1].month);
      const dateB = new Date(b[1].month);
      return dateA.getTime() - dateB.getTime();
    })
    .map(([month]) => month);

  const data = sortedMonths.map((month) => ({
    date: month,
    eggs: monthlyMap.get(month)?.eggs || 0,
    feedKg: monthlyMap.get(month)?.feedKg || 0,
  }));

  const totalEggs = data.reduce((sum, d) => sum + d.eggs, 0);
  const avgMonthly = data.length > 0 ? totalEggs / data.length : 0;

  return { daily: data, avgDaily: avgMonthly, totalEggs };
}
function calculateWeeklyMortality(records: any[], range: TimeRange) {
  const weeklyMap = new Map();
  
  (records || []).forEach((r: any) => {
    if (r.recordDate && (r.deaths || 0) > 0) {
      let key: string;
      if (range === "year") {
        const date = new Date(r.recordDate);
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        const date = new Date(r.recordDate);
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `${date.toLocaleDateString('en-US', { month: 'short' })} W${weekNum}`;
      }
      
      const existing = weeklyMap.get(key) || { 
        deaths: 0, 
        startingBirds: 0, 
        date: key,
        rawDate: new Date(r.recordDate)
      };
      existing.deaths += r.deaths || 0;
      if (!existing.startingBirds && r.liveBirdCountBefore) {
        existing.startingBirds = r.liveBirdCountBefore;
      }
      weeklyMap.set(key, existing);
    }
  });
  
  // Sort by date
  const sortedData = Array.from(weeklyMap.values())
    .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
    .map(item => ({
      date: item.date,
      deaths: item.deaths,
      rate: item.startingBirds > 0 ? (item.deaths / item.startingBirds) * 100 : 0,
    }));
  
  const totalDeaths = sortedData.reduce((sum, d) => sum + d.deaths, 0);
  const avgRate = sortedData.length > 0 ? totalDeaths / sortedData.length : 0;
  
  return { daily: sortedData, avgRate, totalDeaths };
}
