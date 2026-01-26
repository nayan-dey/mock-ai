"use client";

import * as React from "react";
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface RadarChartDataItem {
  subject: string;
  value: number;
  fullMark?: number;
}

interface RadarChartProps {
  data: RadarChartDataItem[];
  dataKey?: string;
  height?: number;
  color?: string;
  fillOpacity?: number;
  showLegend?: boolean;
  legendLabel?: string;
}

export function RadarChart({
  data,
  dataKey = "value",
  height = 300,
  color = "hsl(var(--primary))",
  fillOpacity = 0.3,
  showLegend = false,
  legendLabel = "Score",
}: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid
          stroke="hsl(var(--border))"
          strokeDasharray="3 3"
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fontSize: 11,
            fill: "hsl(var(--muted-foreground))",
          }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{
            fontSize: 10,
            fill: "hsl(var(--muted-foreground))",
          }}
          tickCount={5}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value: number) => [`${value}%`, legendLabel]}
        />
        <Radar
          name={legendLabel}
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={fillOpacity}
          strokeWidth={2}
          dot={{
            r: 4,
            fill: color,
            strokeWidth: 0,
          }}
          activeDot={{
            r: 6,
            fill: color,
            strokeWidth: 2,
            stroke: "hsl(var(--background))",
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
            )}
          />
        )}
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
