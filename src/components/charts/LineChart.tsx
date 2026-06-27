import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartOptions } from "../../hooks/useChartOptions";

interface LineChartProps {
  data: Record<string, unknown>[];
  lines: { key: string; label: string; color?: string }[];
  xKey: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function LineChart({
  data,
  lines,
  xKey,
  height = 280,
  formatValue,
}: LineChartProps) {
  const { palette, tooltipStyle, defaultMargin } = useChartOptions();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={defaultMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={{ stroke: "#334155" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickFormatter={formatValue}
          axisLine={{ stroke: "#334155" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, name: string) => [
            formatValue ? formatValue(value) : value,
            name,
          ]}
        />
        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.label}
            stroke={l.color ?? palette[i % palette.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
