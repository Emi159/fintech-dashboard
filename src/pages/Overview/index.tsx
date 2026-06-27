import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { useDashboard } from "../../context/DashboardContext";
import { KpiCard } from "../../components/cards/KpiCard";
import { SummaryCard } from "../../components/cards/SummaryCard";
import { PieChart } from "../../components/charts/PieChart";
import { BarChart } from "../../components/charts/BarChart";
import { recordToChartData } from "../../utils/dataTransform";
import { formatEURCompact } from "../../utils/formatters";
import { STATUS_COLORS, RISK_COLORS } from "../../utils/constants";

const STATUS_DOT: Record<string, string> = {
  "In Progress": "#3b82f6",
  Completed: "#22c55e",
  Delayed: "#ef4444",
  "On Hold": "#f59e0b",
  "Not Started": "#94a3b8",
};

export default function Overview() {
  const { summary, loading, error } = useDashboard();

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Loading dashboard data…
      </div>
    );
  if (error)
    return <div className="error-box">Error loading data: {error}</div>;
  if (!summary) return null;

  const {
    counts,
    project_status,
    project_risk,
    budget_kpis,
    schedule_kpis,
    budget_by_department,
    projects_detail,
  } = summary;

  const statusData = recordToChartData(project_status);
  const riskData = recordToChartData(project_risk);

  const deptBudgetData = budget_by_department.map((d) => ({
    name: d.Department_Name,
    planned: Math.round(d.total_planned / 1_000_000),
    actual: Math.round(d.total_actual / 1_000_000),
  }));

  const mapProjects = projects_detail.filter(
    (p) =>
      p.Project_Country_Latitude != null && p.Project_Country_Longitude != null,
  );

  return (
    <div className="page">
      <h2 className="page__title">Executive Overview</h2>
      <p className="page__subtitle">
        High-level summary of all {counts.total_projects} projects across Europe
      </p>

      <div className="kpi-grid">
        <KpiCard label="Total Projects" value={String(counts.total_projects)} />
        <KpiCard
          label="Active Projects"
          value={String(project_status["In Progress"] ?? 0)}
          sub="In Progress"
          accent="info"
        />
        <KpiCard
          label="Delayed"
          value={String(project_status["Delayed"] ?? 0)}
          sub="projects behind schedule"
          accent="danger"
        />
        <KpiCard
          label="On-Time Delivery"
          value={`${schedule_kpis.on_time_delivery_rate_pct}%`}
          sub={`${schedule_kpis.on_time_count} of ${schedule_kpis.completed_projects} completed`}
          accent={
            schedule_kpis.on_time_delivery_rate_pct >= 70
              ? "success"
              : "warning"
          }
        />
        <KpiCard
          label="Over-Budget Rate"
          value={`${budget_kpis.over_budget_rate_pct}%`}
          sub={`${budget_kpis.over_budget_count} projects`}
          accent={budget_kpis.over_budget_rate_pct <= 15 ? "success" : "danger"}
        />
        <KpiCard
          label="Avg Completion"
          value={`${schedule_kpis.avg_completion_pct_active}%`}
          sub="active projects"
          accent="info"
        />
        <KpiCard
          label="Total Employees"
          value={String(counts.total_employees)}
        />
        <KpiCard label="Total Tasks" value={String(counts.total_tasks)} />
      </div>

      <div className="chart-grid chart-grid--2">
        <SummaryCard title="Project Status Distribution">
          <PieChart data={statusData} colors={STATUS_COLORS} height={260} />
        </SummaryCard>
        <SummaryCard title="Risk Level Breakdown">
          <PieChart
            data={riskData}
            colors={RISK_COLORS}
            height={260}
            innerRadius={50}
          />
        </SummaryCard>
      </div>

      <SummaryCard title="Budget Planned vs Actual by Department (€M)">
        <BarChart
          data={deptBudgetData}
          bars={[
            { key: "planned", label: "Planned (€M)", color: "#3b82f6" },
            { key: "actual", label: "Actual (€M)", color: "#22c55e" },
          ]}
          xKey="name"
          height={300}
          formatValue={(v) => `€${v}M`}
        />
      </SummaryCard>

      <div style={{ marginTop: 16 }}>
        <SummaryCard title="Projects by City">
          <div
            style={{
              height: 420,
              borderRadius: 8,
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            <MapContainer
              center={[50.5, 10]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {mapProjects.map((p) => (
                <CircleMarker
                  key={p.ProjectID}
                  center={[
                    p.Project_Country_Latitude!,
                    p.Project_Country_Longitude!,
                  ]}
                  radius={7}
                  pathOptions={{
                    color: STATUS_DOT[p.Status] ?? "#94a3b8",
                    fillColor: STATUS_DOT[p.Status] ?? "#94a3b8",
                    fillOpacity: 0.8,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                      <strong>{p.ProductName}</strong>
                      <br />
                      {p.City}, {p.Project_Country}
                      <br />
                      Status: {p.Status}
                      <br />
                      Budget: {formatEURCompact(p.ActualBudget)}
                      <br />
                      Completion: {p.CompletionPercentage}%
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            {Object.entries(STATUS_DOT).map(([status, color]) => (
              <span
                key={status}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                    display: "inline-block",
                  }}
                />
                {status}
              </span>
            ))}
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}
