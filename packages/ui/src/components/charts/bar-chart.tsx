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
  tooltipLabel?: string;
  tooltipValueSuffix?: string;
  showPercentage?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  tooltipSubtitle?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: Record<string, unknown> }>;
  label?: string;
  tooltipLabel?: string;
  tooltipValueSuffix?: string;
  showPercentage?: boolean;
  total?: number;
  subtitle?: string;
  xKey?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  tooltipLabel,
  tooltipValueSuffix = "",
  showPercentage,
  total,
  subtitle,
  xKey
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0].value;
  const percentage = total && total > 0 ? ((value / total) * 100).toFixed(0) : null;
  // Get the label from the payload data using xKey if available, otherwise fall back to label prop
  const displayLabel = xKey && payload[0]?.payload?.[xKey] !== undefined
    ? String(payload[0].payload[xKey])
    : label;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="font-medium text-sm">{displayLabel}{tooltipLabel ? ` ${tooltipLabel}` : ''}</p>
      <p className="text-xs text-muted-foreground mt-1">
        <span className="tabular-nums font-medium text-foreground">{value}</span>
        {total && total > 0 && (
          <span> of {total}</span>
        )}
        {tooltipValueSuffix}
        {showPercentage && percentage && (
          <span className="ml-1">({percentage}%)</span>
        )}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 pt-1 border-t">{subtitle}</p>
      )}
    </div>
  );
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
  tooltipLabel,
  tooltipValueSuffix,
  showPercentage,
  xAxisLabel,
  yAxisLabel,
  tooltipSubtitle,
}: BarChartProps<T>) {
  const isVertical = layout === "vertical";
  const total = React.useMemo(() => {
    if (!showPercentage) return 0;
    return data.reduce((sum, item) => sum + (Number(item[yKey]) || 0), 0);
  }, [data, yKey, showPercentage]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 20, left: yAxisLabel ? 10 : 0, bottom: xAxisLabel ? 20 : 5 }}
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
              label={xAxisLabel ? {
                value: xAxisLabel,
                position: 'bottom',
                offset: 0,
                style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
              } : undefined}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              width={40}
              label={yAxisLabel ? {
                value: yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', textAnchor: 'middle' }
              } : undefined}
            />
          </>
        )}
        <Tooltip
          content={(props) => (
            <CustomTooltip
              {...props}
              tooltipLabel={tooltipLabel}
              tooltipValueSuffix={tooltipValueSuffix}
              showPercentage={showPercentage}
              total={total}
              subtitle={tooltipSubtitle}
              xKey={xKey as string}
            />
          )}
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
