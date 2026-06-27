interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: DateRangeFilterProps) {
  return (
    <>
      <input
        className="filter-input"
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        style={{ minWidth: 140 }}
        title="Start date from"
      />
      <input
        className="filter-input"
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        style={{ minWidth: 140 }}
        title="Start date to"
      />
    </>
  );
}
