import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartOptions } from "../../hooks/useChartOptions";

interface PieChartProps {
  data: { name: string; value: number }[];
  height?: number;
  colors?: Record<string, string>;
  innerRadius?: number;
}

export function PieChart({
  data,
  height = 280,
  colors,
  innerRadius = 55,
}: PieChartProps) {
  const { palette, tooltipStyle } = useChartOptions();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 45}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={colors?.[entry.name] ?? palette[i % palette.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
        />
      </RePieChart>
    </ResponsiveContainer>
  );
}
