interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "success" | "warning" | "danger" | "info";
}

export function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className={`kpi-card${accent ? ` kpi-card__accent--${accent}` : ""}`}>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__value">{value}</div>
      {sub && <div className="kpi-card__sub">{sub}</div>}
    </div>
  );
}
