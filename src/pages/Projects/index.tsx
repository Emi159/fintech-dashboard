import { useMemo, useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { KpiCard } from "../../components/cards/KpiCard";
import { SummaryCard } from "../../components/cards/SummaryCard";
import { ProjectsTable } from "../../components/tables/ProjectsTable";
import { CategoryFilter } from "../../components/filters/CategoryFilter";
import { applyFilters } from "../../utils/dataTransform";
import { STATUS_OPTIONS, RISK_OPTIONS } from "../../utils/constants";
import { formatEURCompact, formatDays } from "../../utils/formatters";
import type { FilterState } from "../../types/dashboard";

const EMPTY_FILTERS: FilterState = {
  status: [],
  riskLevel: [],
  department: [],
  dateFrom: "",
  dateTo: "",
  search: "",
};

export default function Projects() {
  const { summary, flagMap, loading, error } = useDashboard();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const filtered = useMemo(() => {
    if (!summary) return [];
    return applyFilters(summary.projects_detail, filters);
  }, [summary, filters]);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Loading…
      </div>
    );
  if (error) return <div className="error-box">Error: {error}</div>;
  if (!summary) return null;

  const { budget_by_department } = summary;
  const deptOptions = budget_by_department.map((d) => d.Department_Name);

  const overBudget = filtered.filter((p) => p.BudgetVariance > 0);
  const delayed = filtered.filter(
    (p) => (p.ScheduleVarianceDays ?? 0) > 0 && p.Status === "Completed",
  );
  const avgCompletion =
    filtered.length > 0
      ? Math.round(
          filtered.reduce((s, p) => s + p.CompletionPercentage, 0) /
            filtered.length,
        )
      : 0;

  // Gantt-style: top 15 projects sorted by start date
  const ganttData = [...filtered]
    .filter((p) => p.PlannedStartDate)
    .sort((a, b) =>
      (a.PlannedStartDate ?? "").localeCompare(b.PlannedStartDate ?? ""),
    )
    .slice(0, 15);

  return (
    <div className="page">
      <h2 className="page__title">Projects</h2>
      <p className="page__subtitle">
        Browse and filter all {summary.counts.total_projects} projects
      </p>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search project, city, country…"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
        />
        <CategoryFilter
          label="Status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        />
        <CategoryFilter
          label="Risk"
          options={RISK_OPTIONS}
          value={filters.riskLevel}
          onChange={(v) => setFilters((f) => ({ ...f, riskLevel: v }))}
        />
        <button
          className="filter-btn"
          onClick={() => setFilters(EMPTY_FILTERS)}
        >
          Reset
        </button>
      </div>

      {/* KPIs on filtered set */}
      <div className="kpi-grid">
        <KpiCard
          label="Projects Shown"
          value={String(filtered.length)}
          sub={`of ${summary.counts.total_projects}`}
        />
        <KpiCard
          label="Avg Completion"
          value={`${avgCompletion}%`}
          accent="info"
        />
        <KpiCard
          label="Over Budget"
          value={String(overBudget.length)}
          sub={
            overBudget.length > 0
              ? `Largest: ${formatEURCompact(Math.max(...overBudget.map((p) => p.BudgetVariance)))}`
              : "—"
          }
          accent={overBudget.length > 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Schedule Overruns"
          value={String(delayed.length)}
          sub={
            delayed.length > 0
              ? `Worst: ${formatDays(Math.max(...delayed.map((p) => p.ScheduleVarianceDays ?? 0)))}`
              : "—"
          }
          accent={delayed.length > 0 ? "warning" : "success"}
        />
      </div>

      {/* Gantt-style timeline */}
      <SummaryCard title="Project Timeline — Planned vs Actual (top 15 by start date)">
        <div style={{ overflowX: "auto", paddingTop: 8 }}>
          <GanttChart projects={ganttData} />
        </div>
      </SummaryCard>

      {/* Table */}
      <div style={{ marginTop: 16 }}>
        <ProjectsTable data={filtered} flagMap={flagMap} />
      </div>
    </div>
  );
}

// Inline mini Gantt using CSS bars
function GanttChart({
  projects,
}: {
  projects: ReturnType<typeof applyFilters>;
}) {
  if (projects.length === 0)
    return (
      <p style={{ color: "#64748b", fontSize: 13 }}>No projects to display.</p>
    );

  function parseDate(d: string | null | undefined): number | null {
    if (!d || d === "NaT") return null;
    const t = new Date(d).getTime();
    return isNaN(t) ? null : t;
  }

  const allMs = projects
    .flatMap((p) => [
      p.PlannedStartDate,
      p.PlannedEndDate,
      p.ActualStartDate,
      p.ActualEndDate,
    ])
    .map(parseDate)
    .filter((t): t is number => t !== null);

  const minMs = Math.min(...allMs);
  const maxMs = Math.max(...allMs);
  const span = maxMs - minMs || 1;

  function pct(date: string | null | undefined): number | null {
    const t = parseDate(date);
    if (t === null) return null;
    return ((t - minMs) / span) * 100;
  }

  const STATUS_COLOR: Record<string, string> = {
    "In Progress": "#3b82f6",
    Completed: "#22c55e",
    Delayed: "#ef4444",
    "On Hold": "#f59e0b",
    "Not Started": "#475569",
  };

  return (
    <div style={{ minWidth: 600 }}>
      {projects.map((p) => {
        const ps = pct(p.PlannedStartDate);
        const pe = pct(p.PlannedEndDate);
        const as_ = pct(p.ActualStartDate);
        const ae = pct(p.ActualEndDate ?? p.PlannedEndDate);
        const color = STATUS_COLOR[p.Status] ?? "#475569";

        return (
          <div
            key={p.ProjectID}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 6,
              gap: 8,
            }}
          >
            <span
              style={{
                width: 130,
                fontSize: 11,
                color: "#94a3b8",
                textAlign: "right",
                flexShrink: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {p.ProductName}
            </span>
            <div style={{ flex: 1, position: "relative", height: 22 }}>
              {/* planned bar */}
              {ps != null && pe != null && (
                <div
                  title={`Planned: ${p.PlannedStartDate?.slice(0, 10)} → ${p.PlannedEndDate?.slice(0, 10)}`}
                  style={{
                    position: "absolute",
                    left: `${ps}%`,
                    width: `${Math.max(pe - ps, 0.5)}%`,
                    top: 2,
                    height: 8,
                    background: "#64748b",
                    borderRadius: 4,
                  }}
                />
              )}
              {/* actual bar */}
              {as_ != null && ae != null && (
                <div
                  title={`Actual: ${p.ActualStartDate?.slice(0, 10)} → ${(p.ActualEndDate ?? p.PlannedEndDate)?.slice(0, 10)}`}
                  style={{
                    position: "absolute",
                    left: `${as_}%`,
                    width: `${Math.max(ae - as_, 0.5)}%`,
                    top: 12,
                    height: 8,
                    background: color,
                    borderRadius: 4,
                    opacity: 0.85,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        <span
          style={{
            fontSize: 11,
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 24,
              height: 6,
              background: "#334155",
              borderRadius: 3,
              display: "inline-block",
            }}
          />{" "}
          Planned
        </span>
        <span
          style={{
            fontSize: 11,
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 24,
              height: 6,
              background: "#3b82f6",
              borderRadius: 3,
              display: "inline-block",
            }}
          />{" "}
          Actual
        </span>
      </div>
    </div>
  );
}
