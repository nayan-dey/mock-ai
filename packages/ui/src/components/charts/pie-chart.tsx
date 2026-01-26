"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export function PieChart({
  data,
  height = 250,
  showLegend = true,
  innerRadius = 50,
  outerRadius = 80,
  colors = DEFAULT_COLORS,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
              strokeWidth={0}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
            )}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
