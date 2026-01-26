"use client";

import * as React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface LineChartProps<T> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  yKey2?: keyof T;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  color2?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  legendLabel?: string;
  legendLabel2?: string;
}

export function LineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  yKey2,
  color = "hsl(var(--primary))",
  color2 = "hsl(var(--success))",
  height = 250,
  showGrid = true,
  showLegend = false,
  legendLabel,
  legendLabel2,
}: LineChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
        )}
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
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: "12px" }} />}
        <Line
          type="monotone"
          dataKey={yKey as string}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          name={legendLabel || (yKey as string)}
        />
        {yKey2 && (
          <Line
            type="monotone"
            dataKey={yKey2 as string}
            stroke={color2}
            strokeWidth={2}
            dot={{ fill: color2, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            name={legendLabel2 || (yKey2 as string)}
          />
        )}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
