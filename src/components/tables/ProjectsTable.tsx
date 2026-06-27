import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import type { ProjectDetail } from "../../types/dashboard";
import {
  formatEURCompact,
  formatPct,
  formatDays,
} from "../../utils/formatters";
import { COUNTRY_TO_ISO2 } from "../../utils/constants";

const col = createColumnHelper<ProjectDetail>();

const STATUS_CLASS: Record<string, string> = {
  "In Progress": "in-progress",
  Completed: "completed",
  Delayed: "delayed",
  "On Hold": "on-hold",
  "Not Started": "not-started",
};

function buildColumns(flagMap: Record<string, string>) {
  return [
    col.accessor("ProjectID", { header: "ID", size: 70 }),
    col.accessor("ProductName", { header: "Product", size: 160 }),
    col.accessor("City", { header: "City", size: 110 }),
    col.accessor("Project_Country", {
      header: "Country",
      size: 150,
      cell: (info) => {
        const country = info.getValue();
        const iso2 = COUNTRY_TO_ISO2[country];
        const flagUrl = iso2 ? flagMap[iso2] : undefined;
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {flagUrl && (
              <img
                src={flagUrl}
                alt={country}
                width={20}
                height={20}
                style={{ borderRadius: "50%", flexShrink: 0 }}
              />
            )}
            {country}
          </span>
        );
      },
    }),
    col.accessor("Status", {
      header: "Status",
      size: 120,
      cell: (info) => (
        <span
          className={`badge badge--${STATUS_CLASS[info.getValue()] ?? "not-started"}`}
        >
          {info.getValue()}
        </span>
      ),
    }),
    col.accessor("RiskLevel", {
      header: "Risk",
      size: 80,
      cell: (info) => (
        <span className={`badge badge--${info.getValue().toLowerCase()}`}>
          {info.getValue()}
        </span>
      ),
    }),
    col.accessor("CompletionPercentage", {
      header: "Progress",
      size: 120,
      cell: (info) => (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="progress">
            <span
              className="progress__fill"
              style={{ width: `${info.getValue()}%` }}
            />
          </span>
          {info.getValue()}%
        </span>
      ),
    }),
    col.accessor("PlannedBudget", {
      header: "Planned Budget",
      size: 120,
      cell: (info) => formatEURCompact(info.getValue()),
    }),
    col.accessor("ActualBudget", {
      header: "Actual Budget",
      size: 120,
      cell: (info) => formatEURCompact(info.getValue()),
    }),
    col.accessor("BudgetVariancePct", {
      header: "Budget Var %",
      size: 110,
      cell: (info) => {
        const v = info.getValue();
        const color = v > 0 ? "#f87171" : v < 0 ? "#4ade80" : "#94a3b8";
        return <span style={{ color }}>{formatPct(v)}</span>;
      },
    }),
    col.accessor("ScheduleVarianceDays", {
      header: "Schedule Var",
      size: 110,
      cell: (info) => {
        const v = info.getValue();
        if (v == null) return <span style={{ color: "#94a3b8" }}>—</span>;
        const color = v > 0 ? "#f87171" : v < 0 ? "#4ade80" : "#94a3b8";
        return <span style={{ color }}>{formatDays(v)}</span>;
      },
    }),
    col.accessor("task_count", { header: "Tasks", size: 70 }),
    col.accessor("LabourCost", {
      header: "Labour Cost",
      size: 120,
      cell: (info) => formatEURCompact(info.getValue()),
    }),
  ];
}

interface ProjectsTableProps {
  data: ProjectDetail[];
  flagMap?: Record<string, string>;
}

export function ProjectsTable({ data, flagMap = {} }: ProjectsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = buildColumns(flagMap);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="table-wrap">
      <table>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  style={{ width: h.getSize() }}
                  onClick={h.column.getToggleSortingHandler()}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {h.column.getIsSorted() === "asc"
                    ? " ↑"
                    : h.column.getIsSorted() === "desc"
                      ? " ↓"
                      : ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{
          padding: "10px 14px",
          fontSize: 12,
          color: "#64748b",
          borderTop: "1px solid #334155",
        }}
      >
        {table.getRowModel().rows.length} projects
      </div>
    </div>
  );
}
