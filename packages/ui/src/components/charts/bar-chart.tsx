"use client";

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface BarChartProps<T> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  yKey2?: keyof T;
  color?: string;
  color2?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  legendLabel?: string;
  legendLabel2?: string;
  layout?: "horizontal" | "vertical";
  barColors?: string[];
}

export function BarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  yKey2,
  color = "hsl(var(--primary))",
  color2 = "hsl(var(--destructive))",
  height = 250,
  showGrid = true,
  showLegend = false,
  legendLabel,
  legendLabel2,
  layout = "horizontal",
  barColors,
}: BarChartProps<T>) {
  const isVertical = layout === "vertical";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
        )}
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey={xKey as string}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey as string}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              width={40}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: "12px" }} />}
        <Bar
          dataKey={yKey as string}
          fill={color}
          radius={[4, 4, 0, 0]}
          name={legendLabel || (yKey as string)}
        >
          {barColors &&
            data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
            ))}
        </Bar>
        {yKey2 && (
          <Bar
            dataKey={yKey2 as string}
            fill={color2}
            radius={[4, 4, 0, 0]}
            name={legendLabel2 || (yKey2 as string)}
          />
        )}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
