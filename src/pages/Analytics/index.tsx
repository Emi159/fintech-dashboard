import { useDashboard } from "../../context/DashboardContext";
import { KpiCard } from "../../components/cards/KpiCard";
import { SummaryCard } from "../../components/cards/SummaryCard";
import { BarChart } from "../../components/charts/BarChart";
import { PieChart } from "../../components/charts/PieChart";
import { formatEURCompact } from "../../utils/formatters";
import { EXPERIENCE_COLORS } from "../../utils/constants";

export default function Analytics() {
  const { summary, loading, error } = useDashboard();

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Loading…
      </div>
    );
  if (error) return <div className="error-box">Error: {error}</div>;
  if (!summary) return null;

  const {
    labour_by_experience,
    top_labour_cost_projects,
    top_workload_employees,
    employee_workload_stats,
    budget_by_country,
    task_kpis,
  } = summary;

  const totalLabour = labour_by_experience.reduce(
    (s, r) => s + r.total_labour_cost,
    0,
  );

  // Labour cost by experience as pie
  const labourPieData = labour_by_experience.map((r) => ({
    name: r.ExperienceLevel,
    value: Math.round(r.total_labour_cost),
  }));

  // Hourly rate by experience
  const rateData = labour_by_experience.map((r) => ({
    name: r.ExperienceLevel,
    rate: Math.round(r.avg_hourly_rate),
    employees: r.employee_count,
  }));

  // Labour cost by country
  const countryLabour = budget_by_country
    .sort((a, b) => b.total_actual - a.total_actual)
    .slice(0, 10)
    .map((c) => ({
      name: c.Project_Country,
      budget: Math.round(c.total_actual / 1000),
    }));

  // Workload hours per experience from labour data
  const workloadExp = labour_by_experience.map((r) => ({
    name: r.ExperienceLevel,
    hours: Math.round(r.total_actual_hours),
    cost: Math.round(r.total_labour_cost),
  }));

  // Hours efficiency (planned / actual)
  const efficiency =
    task_kpis.total_actual_hours > 0
      ? (
          (task_kpis.total_planned_hours / task_kpis.total_actual_hours) *
          100
        ).toFixed(1)
      : "—";

  return (
    <div className="page">
      <h2 className="page__title">Analytics</h2>
      <p className="page__subtitle">
        Resource costs, workload distribution, and labour efficiency
      </p>

      <div className="kpi-grid">
        <KpiCard
          label="Total Labour Cost"
          value={formatEURCompact(totalLabour)}
          sub="all projects"
          accent="info"
        />
        <KpiCard
          label="Avg Hourly Rate"
          value={`€${Math.round(labour_by_experience.reduce((s, r) => s + r.avg_hourly_rate * r.employee_count, 0) / labour_by_experience.reduce((s, r) => s + r.employee_count, 0))}/h`}
          sub="across all levels"
        />
        <KpiCard
          label="Hours Efficiency"
          value={`${efficiency}%`}
          sub="planned / actual"
          accent={Number(efficiency) >= 95 ? "success" : "warning"}
        />
        <KpiCard
          label="Avg Hours / Employee"
          value={String(
            Math.round(employee_workload_stats.avg_actual_hours_per_employee),
          )}
          sub={`Max: ${Math.round(employee_workload_stats.max_actual_hours)}h`}
        />
      </div>

      {/* Labour cost by experience */}
      <div className="chart-grid chart-grid--2">
        <SummaryCard title="Labour Cost by Experience Level">
          <PieChart
            data={labourPieData}
            colors={EXPERIENCE_COLORS}
            height={260}
          />
        </SummaryCard>

        <SummaryCard title="Avg Hourly Rate by Experience (€/hr)">
          <BarChart
            data={rateData}
            bars={[{ key: "rate", label: "€/hr" }]}
            xKey="name"
            height={260}
            formatValue={(v) => `€${v}`}
          />
        </SummaryCard>
      </div>

      {/* Workload by experience */}
      <SummaryCard title="Total Actual Hours by Experience Level">
        <BarChart
          data={workloadExp}
          bars={[{ key: "hours", label: "Actual Hours", color: "#38bdf8" }]}
          xKey="name"
          height={220}
          formatValue={(v) => `${v.toLocaleString()}h`}
        />
      </SummaryCard>

      {/* Labour cost & budget by country */}
      <div className="chart-grid chart-grid--2" style={{ marginTop: 16 }}>
        <SummaryCard title="Top 10 Countries by Actual Budget (€K)">
          <BarChart
            data={countryLabour}
            bars={[
              { key: "budget", label: "Actual Budget (€K)", color: "#8b5cf6" },
            ]}
            xKey="name"
            height={300}
            formatValue={(v) => `€${v}K`}
            horizontal
          />
        </SummaryCard>

        <SummaryCard title="Top 10 Employees by Workload">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Employee", "Role", "Level", "Hours", "Labour Cost"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "7px 8px",
                          color: "#64748b",
                          fontWeight: 600,
                          borderBottom: "1px solid #334155",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {top_workload_employees.map((e) => (
                  <tr key={e.EmployeeID}>
                    <td style={{ padding: "7px 8px", color: "#f1f5f9" }}>
                      {e.FullName}
                    </td>
                    <td style={{ padding: "7px 8px", color: "#94a3b8" }}>
                      {e.Role}
                    </td>
                    <td style={{ padding: "7px 8px" }}>
                      <span
                        style={{
                          color:
                            EXPERIENCE_COLORS[e.ExperienceLevel] ?? "#94a3b8",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        {e.ExperienceLevel}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "7px 8px",
                        color: "#f1f5f9",
                        textAlign: "right",
                      }}
                    >
                      {Math.round(e.total_actual_hours)}h
                    </td>
                    <td
                      style={{
                        padding: "7px 8px",
                        color: "#f1f5f9",
                        textAlign: "right",
                      }}
                    >
                      {formatEURCompact(e.labour_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SummaryCard>
      </div>

      {/* Top labour cost projects */}
      <div style={{ marginTop: 16 }}>
        <SummaryCard title="Top 10 Projects by Labour Cost">
          <BarChart
            data={top_labour_cost_projects.map((p) => ({
              name: `${p.ProjectID} – ${p.ProductName}`,
              cost: Math.round(p.LabourCost / 1000),
            }))}
            bars={[
              { key: "cost", label: "Labour Cost (€K)", color: "#f472b6" },
            ]}
            xKey="name"
            height={300}
            formatValue={(v) => `€${v}K`}
            horizontal
          />
        </SummaryCard>
      </div>
    </div>
  );
}
