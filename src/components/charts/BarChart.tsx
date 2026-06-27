import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useChartOptions } from "../../hooks/useChartOptions";

interface BarChartProps {
  data: Record<string, unknown>[];
  bars: { key: string; label: string; color?: string }[];
  xKey: string;
  height?: number;
  formatValue?: (v: number) => string;
  horizontal?: boolean;
}

export function BarChart({
  data,
  bars,
  xKey,
  height = 280,
  formatValue,
  horizontal = false,
}: BarChartProps) {
  const { palette, tooltipStyle, defaultMargin } = useChartOptions();

  const margin = horizontal
    ? { top: 10, right: 30, left: 120, bottom: 10 }
    : defaultMargin;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={margin}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={formatValue}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
              width={115}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={formatValue}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
            />
          </>
        )}
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, name: string) => [
            formatValue ? formatValue(value) : value,
            name,
          ]}
        />
        {bars.length > 1 && (
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
        )}
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label}
            fill={b.color ?? palette[i % palette.length]}
            radius={3}
          >
            {bars.length === 1 &&
              data.map((_entry, idx) => (
                <Cell key={idx} fill={palette[idx % palette.length]} />
              ))}
          </Bar>
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}
