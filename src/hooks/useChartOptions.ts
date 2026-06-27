import { CHART_PALETTE, STATUS_COLORS, RISK_COLORS } from "../utils/constants";

export function useChartOptions() {
  const defaultMargin = { top: 10, right: 20, left: 10, bottom: 40 };

  const tooltipStyle = {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#f1f5f9",
    fontSize: "13px",
  };

  return {
    palette: CHART_PALETTE,
    statusColors: STATUS_COLORS,
    riskColors: RISK_COLORS,
    defaultMargin,
    tooltipStyle,
  };
}
