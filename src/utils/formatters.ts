const EUR = new Intl.NumberFormat("en-EU", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const NUM = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatEUR(value: number | null | undefined): string {
  if (value == null) return "—";
  return EUR.format(value);
}

export function formatEURCompact(value: number | null | undefined): string {
  if (value == null) return "—";
  if (Math.abs(value) >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return EUR.format(value);
}

export function formatPct(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatPctAbs(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (value == null) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function formatNum(value: number | null | undefined): string {
  if (value == null) return "—";
  return NUM.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDays(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value}d`;
}

export function formatHours(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${NUM.format(Math.round(value))}h`;
}
