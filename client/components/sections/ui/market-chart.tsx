'use client';

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export function MarketChart({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((value, index) => ({
    index: index + 1,
    value,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`marketGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="index" stroke="rgba(0,0,0,0.1)" fontSize={10} axisLine={false} tickLine={false} ticks={[1, 4, 7, 10, 12]} />
        <YAxis
          stroke="rgba(0,0,0,0.1)"
          fontSize={10}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
          tickFormatter={(value) => `KES ${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`KES ${value}`, 'Price']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#marketGradient-${color})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}