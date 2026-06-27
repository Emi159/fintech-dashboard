import { useDashboard } from "../../context/DashboardContext";
import { KpiCard } from "../../components/cards/KpiCard";
import { SummaryCard } from "../../components/cards/SummaryCard";
import { BarChart } from "../../components/charts/BarChart";
import { LineChart } from "../../components/charts/LineChart";
import { formatEURCompact, formatDays } from "../../utils/formatters";

export default function Performance() {
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
    schedule_kpis,
    task_kpis,
    milestone_kpis,
    budget_by_department,
    projects_detail,
    task_status,
    milestone_status,
  } = summary;

  // On-time delivery by department
  const deptDelivery = budget_by_department.map((d) => {
    const deptProjects = projects_detail.filter((p) => {
      // map DepartmentID back via name — use dept name as key
      return p.DepartmentID && d.Department_Name;
    });
    const completed = projects_detail.filter((p) => p.Status === "Completed");
    const deptCompleted = completed.filter((p) => {
      const idx = budget_by_department.findIndex(
        (bd) => bd.Department_Name === d.Department_Name,
      );
      return idx >= 0;
    });
    return {
      name: d.Department_Name,
      variance: Math.round(d.avg_variance_pct),
    };
  });

  // Budget variance by department
  const budgetVarData = budget_by_department.map((d) => ({
    name: d.Department_Name,
    variance: Math.round(d.avg_variance_pct),
  }));

  // Top delayed projects
  const topDelayed = [...projects_detail]
    .filter((p) => (p.ScheduleVarianceDays ?? 0) > 0)
    .sort(
      (a, b) => (b.ScheduleVarianceDays ?? 0) - (a.ScheduleVarianceDays ?? 0),
    )
    .slice(0, 8);

  // Top over-budget projects
  const topOverBudget = [...projects_detail]
    .filter((p) => p.BudgetVariance > 0)
    .sort((a, b) => b.BudgetVariance - a.BudgetVariance)
    .slice(0, 8);

  // Task status breakdown
  const taskStatusData = Object.entries(task_status).map(([name, value]) => ({
    name,
    value,
  }));
  const milestoneStatusData = Object.entries(milestone_status).map(
    ([name, value]) => ({ name, value }),
  );

  // Hours planned vs actual per month — approximate from task hours total
  const hoursData = [
    { name: "Planned", hours: Math.round(task_kpis.total_planned_hours) },
    { name: "Actual", hours: Math.round(task_kpis.total_actual_hours) },
  ];

  const taskStatusColors: Record<string, string> = {
    Completed: "#22c55e",
    "In Progress": "#3b82f6",
    "On Hold": "#f59e0b",
    "Review Required": "#8b5cf6",
  };

  const msColors: Record<string, string> = {
    Completed: "#22c55e",
    "On Track": "#3b82f6",
    Delayed: "#ef4444",
  };

  return (
    <div className="page">
      <h2 className="page__title">Performance</h2>
      <p className="page__subtitle">
        Delivery efficiency, task health, and schedule analysis
      </p>

      <div className="kpi-grid">
        <KpiCard
          label="On-Time Delivery"
          value={`${schedule_kpis.on_time_delivery_rate_pct}%`}
          sub={`${schedule_kpis.on_time_count} / ${schedule_kpis.completed_projects} completed`}
          accent={
            schedule_kpis.on_time_delivery_rate_pct >= 70
              ? "success"
              : "warning"
          }
        />
        <KpiCard
          label="Avg Schedule Overrun"
          value={formatDays(schedule_kpis.avg_schedule_variance_days)}
          sub="completed projects"
          accent={
            schedule_kpis.avg_schedule_variance_days > 0 ? "danger" : "success"
          }
        />
        <KpiCard
          label="Task Completion Rate"
          value={`${task_kpis.task_completion_rate_pct}%`}
          sub={`${task_kpis.completed_tasks} / ${task_kpis.total_tasks}`}
          accent="info"
        />
        <KpiCard
          label="Milestone On-Time"
          value={`${milestone_kpis.milestone_on_time_rate_pct}%`}
          sub={`Avg delay: ${milestone_kpis.avg_delay_days}d`}
          accent={
            milestone_kpis.milestone_on_time_rate_pct >= 60
              ? "success"
              : "warning"
          }
        />
        <KpiCard
          label="Avg Hours Variance"
          value={`${task_kpis.avg_hours_variance > 0 ? "+" : ""}${task_kpis.avg_hours_variance}h`}
          sub="per task"
          accent={task_kpis.avg_hours_variance > 5 ? "danger" : "success"}
        />
      </div>

      {/* Budget variance & top delayed */}
      <div className="chart-grid chart-grid--2">
        <SummaryCard title="Avg Budget Variance % by Department">
          <BarChart
            data={budgetVarData}
            bars={[
              { key: "variance", label: "Avg Variance %", color: "#f59e0b" },
            ]}
            xKey="name"
            height={280}
            formatValue={(v) => `${v}%`}
            horizontal
          />
        </SummaryCard>

        <SummaryCard title="Top Delayed Projects (Schedule Variance)">
          <BarChart
            data={topDelayed.map((p) => ({
              name: p.ProductName,
              days: p.ScheduleVarianceDays ?? 0,
            }))}
            bars={[{ key: "days", label: "Days Late", color: "#ef4444" }]}
            xKey="name"
            height={280}
            formatValue={(v) => `+${v}d`}
            horizontal
          />
        </SummaryCard>
      </div>

      {/* Top over-budget */}
      <SummaryCard title="Top Over-Budget Projects">
        <BarChart
          data={topOverBudget.map((p) => ({
            name: `${p.ProjectID} – ${p.ProductName}`,
            variance: p.BudgetVariance,
          }))}
          bars={[
            { key: "variance", label: "Budget Overrun (€)", color: "#ef4444" },
          ]}
          xKey="name"
          height={260}
          formatValue={(v) => formatEURCompact(v)}
          horizontal
        />
      </SummaryCard>

      {/* Task & milestone status */}
      <div className="chart-grid chart-grid--2" style={{ marginTop: 16 }}>
        <SummaryCard title="Task Status Breakdown">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 0",
                      color: "#64748b",
                      fontWeight: 600,
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0",
                      color: "#64748b",
                      fontWeight: 600,
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    Count
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0",
                      color: "#64748b",
                      fontWeight: 600,
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {taskStatusData.map((r) => (
                  <tr key={r.name}>
                    <td
                      style={{
                        padding: "7px 0",
                        color: taskStatusColors[r.name] ?? "#94a3b8",
                      }}
                    >
                      {r.name}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "7px 0",
                        color: "#f1f5f9",
                      }}
                    >
                      {r.value}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "7px 0",
                        color: "#94a3b8",
                      }}
                    >
                      {((r.value / task_kpis.total_tasks) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SummaryCard>

        <SummaryCard title="Milestone Status Breakdown">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 0",
                      color: "#64748b",
                      fontWeight: 600,
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0",
                      color: "#64748b",
                      fontWeight: 600,
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    Count
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 0",
                      color: "#64748b",
                      fontWeight: 600,
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {milestoneStatusData.map((r) => (
                  <tr key={r.name}>
                    <td
                      style={{
                        padding: "7px 0",
                        color: msColors[r.name] ?? "#94a3b8",
                      }}
                    >
                      {r.name}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "7px 0",
                        color: "#f1f5f9",
                      }}
                    >
                      {r.value}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "7px 0",
                        color: "#94a3b8",
                      }}
                    >
                      {(
                        (r.value / milestone_kpis.total_milestones) *
                        100
                      ).toFixed(1)}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SummaryCard>
      </div>

      {/* Hours planned vs actual */}
      <div style={{ marginTop: 16 }}>
        <SummaryCard title="Total Hours: Planned vs Actual">
          <BarChart
            data={hoursData}
            bars={[{ key: "hours", label: "Hours" }]}
            xKey="name"
            height={200}
            formatValue={(v) => `${(v / 1000).toFixed(0)}K`}
          />
        </SummaryCard>
      </div>
    </div>
  );
}
