interface CategoryFilterProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function CategoryFilter({
  label,
  options,
  value,
  onChange,
}: CategoryFilterProps) {
  function toggle(opt: string) {
    onChange(
      value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt],
    );
  }

  return (
    <select
      className="filter-select"
      value={value[0] ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v ? [v] : []);
      }}
    >
      <option value="">{label}: All</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
