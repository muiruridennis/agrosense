// components/ui/hero-chart.tsx
"use client";

import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [
  { day: "Mon", eggs: 320, target: 350 },
  { day: "Tue", eggs: 340, target: 350 },
  { day: "Wed", eggs: 355, target: 350 },
  { day: "Thu", eggs: 360, target: 350 },
  { day: "Fri", eggs: 375, target: 350 },
  { day: "Sat", eggs: 390, target: 350 },
  { day: "Sun", eggs: 405, target: 350 },
];

export function HeroChart() {
  return (
    <div className="relative">
      {/* Glow Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-accent/10 via-primary/5 to-secondary/10 blur-3xl rounded-full" />

      {/* Card */}
      <div className="relative bg-[#0F1F3A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-white/40 text-xs font-medium tracking-wider uppercase">
              Production Overview
            </div>
            <div className="text-white text-2xl font-bold">1,245 Eggs</div>
            <div className="text-success text-sm">↑ 12.4% vs last week</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white/40 text-xs">Flock</div>
              <div className="text-white font-bold">1,250</div>
            </div>
            <div className="text-right">
              <div className="text-white/40 text-xs">Mortality</div>
              <div className="text-white font-bold">1.2%</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <defs>
                <linearGradient id="eggGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="rgba(255,255,255,0.2)"
                fontSize={10}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                domain={[300, 450]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A1628",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="eggs"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#eggGradient)"
                dot={{ fill: "#F59E0B", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
          <div>
            <div className="text-white/40 text-xs">Feed Consumed</div>
            <div className="text-white font-semibold">2,450 kg</div>
          </div>
          <div>
            <div className="text-white/40 text-xs">FCR</div>
            <div className="text-white font-semibold">1.95</div>
          </div>
          <div>
            <div className="text-white/40 text-xs">Health Status</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-white font-semibold text-sm">Good</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Label */}
      <div className="absolute -top-2 -right-2 bg-success text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        Live Data
      </div>
    </div>
  );
}
