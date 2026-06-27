import pandas as pd
import json
import sys
import numpy as np
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

CLEAN_DIR = Path(__file__).parent.parent / "data" / "processed" / "clean"
OUT = Path(__file__).parent.parent / "data" / "processed" / "summary.json"

def load(name):
    with open(CLEAN_DIR / f"{name}.json", encoding="utf-8") as f:
        return pd.DataFrame(json.load(f))

def to_serializable(obj):
    if isinstance(obj, (np.integer,)): return int(obj)
    if isinstance(obj, (np.floating,)): return None if np.isnan(obj) else float(obj)
    if isinstance(obj, pd.Timestamp): return obj.isoformat() if pd.notna(obj) else None
    if isinstance(obj, float): return None if np.isnan(obj) else obj
    return obj

def clean_dict(d):
    return {k: to_serializable(v) for k, v in d.items()}

proj = load("projects")
tasks = load("tasks")
emp = load("employees")
dept = load("departments")
ms = load("milestones")

# Parse dates robustly
for c in ["PlannedStartDate","PlannedEndDate","ActualStartDate","ActualEndDate"]:
    proj[c] = pd.to_datetime(proj[c], errors="coerce")
for c in ["PlannedCompletionDate","ActualCompletionDate"]:
    ms[c] = pd.to_datetime(ms[c], errors="coerce")

summary = {}

# ── 1. High-level counts ─────────────────────────────────────────────────────
summary["counts"] = {
    "total_projects": int(len(proj)),
    "total_tasks": int(len(tasks)),
    "total_employees": int(len(emp)),
    "total_departments": int(len(dept)),
    "total_milestones": int(len(ms)),
}

# ── 2. Project status distribution ───────────────────────────────────────────
summary["project_status"] = {
    k: int(v) for k, v in proj["Status"].value_counts().items()
}

# ── 3. Risk level distribution ────────────────────────────────────────────────
summary["project_risk"] = {
    k: int(v) for k, v in proj["RiskLevel"].value_counts().items()
}

# ── 4. KPI — Budget ───────────────────────────────────────────────────────────
proj["BudgetVariance"] = proj["ActualBudget"] - proj["PlannedBudget"]
proj["BudgetVariancePct"] = proj["BudgetVariance"] / proj["PlannedBudget"] * 100
over_budget = (proj["ActualBudget"] > proj["PlannedBudget"]).sum()

summary["budget_kpis"] = {
    "total_planned_budget": float(proj["PlannedBudget"].sum()),
    "total_actual_budget": float(proj["ActualBudget"].sum()),
    "total_budget_variance": float(proj["BudgetVariance"].sum()),
    "over_budget_count": int(over_budget),
    "over_budget_rate_pct": round(over_budget / len(proj) * 100, 1),
    "avg_budget_variance_pct": round(proj["BudgetVariancePct"].mean(), 1),
}

# ── 5. KPI — Schedule ─────────────────────────────────────────────────────────
completed = proj[proj["Status"] == "Completed"].copy()
completed["ScheduleVarianceDays"] = (
    completed["ActualEndDate"] - completed["PlannedEndDate"]
).dt.days
on_time = (completed["ScheduleVarianceDays"] <= 0).sum()

summary["schedule_kpis"] = {
    "completed_projects": int(len(completed)),
    "on_time_count": int(on_time),
    "on_time_delivery_rate_pct": round(on_time / len(completed) * 100, 1) if len(completed) else None,
    "avg_schedule_variance_days": round(completed["ScheduleVarianceDays"].mean(), 1) if len(completed) else None,
    "avg_completion_pct_active": round(proj[proj["Status"] == "In Progress"]["CompletionPercentage"].mean(), 1),
}

# ── 6. Budget variance by department ─────────────────────────────────────────
proj_dept = proj.merge(dept, left_on="DepartmentID", right_on="Department_ID", how="left")
budget_by_dept = proj_dept.groupby("Department_Name").agg(
    projects=("ProjectID", "count"),
    total_planned=("PlannedBudget", "sum"),
    total_actual=("ActualBudget", "sum"),
    avg_variance_pct=("BudgetVariancePct", "mean"),
).reset_index()
summary["budget_by_department"] = [clean_dict(r) for r in budget_by_dept.to_dict("records")]

# ── 7. Budget variance by country ─────────────────────────────────────────────
budget_by_country = proj.groupby("Project_Country").agg(
    projects=("ProjectID", "count"),
    total_planned=("PlannedBudget", "sum"),
    total_actual=("ActualBudget", "sum"),
    avg_variance_pct=("BudgetVariancePct", "mean"),
).reset_index()
summary["budget_by_country"] = [clean_dict(r) for r in budget_by_country.to_dict("records")]

# ── 8. Task KPIs ──────────────────────────────────────────────────────────────
tasks["HoursVariance"] = tasks["ActualHours"] - tasks["PlannedHours"]
tasks_complete = tasks["TaskStatus"] == "Completed"
blocked = tasks["TaskStatus"].isin(["On Hold", "Review Required"])

summary["task_kpis"] = {
    "total_tasks": int(len(tasks)),
    "completed_tasks": int(tasks_complete.sum()),
    "task_completion_rate_pct": round(tasks_complete.sum() / len(tasks) * 100, 1),
    "blocked_tasks": int(blocked.sum()),
    "blocked_task_rate_pct": round(blocked.sum() / len(tasks) * 100, 1),
    "avg_hours_variance": round(tasks["HoursVariance"].mean(), 1),
    "total_planned_hours": float(tasks["PlannedHours"].sum()),
    "total_actual_hours": float(tasks["ActualHours"].sum()),
}

# Task status distribution
summary["task_status"] = {k: int(v) for k, v in tasks["TaskStatus"].value_counts().items()}
summary["task_priority"] = {k: int(v) for k, v in tasks["Priority"].value_counts().items()}

# ── 9. Labour cost ────────────────────────────────────────────────────────────
tasks_emp = tasks.merge(emp[["EmployeeID","HourlyRate","ExperienceLevel","Role","DepartmentID"]],
                        on="EmployeeID", how="left")
tasks_emp["LabourCost"] = tasks_emp["ActualHours"] * tasks_emp["HourlyRate"]
tasks_proj = tasks_emp.merge(proj[["ProjectID","DepartmentID"]].rename(
    columns={"DepartmentID":"ProjectDeptID"}), on="ProjectID", how="left")

labour_by_project = tasks_emp.groupby("ProjectID")["LabourCost"].sum().reset_index()
labour_by_project.columns = ["ProjectID", "LabourCost"]
labour_by_project = labour_by_project.merge(proj[["ProjectID","ProductName","Status"]], on="ProjectID")

summary["top_labour_cost_projects"] = [
    clean_dict(r) for r in
    labour_by_project.nlargest(10, "LabourCost")[["ProjectID","ProductName","Status","LabourCost"]].to_dict("records")
]

# Labour cost by experience level
labour_exp = tasks_emp.groupby("ExperienceLevel").agg(
    avg_hourly_rate=("HourlyRate", "mean"),
    total_labour_cost=("LabourCost", "sum"),
    total_actual_hours=("ActualHours", "sum"),
    employee_count=("EmployeeID", "nunique"),
).reset_index()
summary["labour_by_experience"] = [clean_dict(r) for r in labour_exp.to_dict("records")]

# ── 10. Employee workload ──────────────────────────────────────────────────────
workload = tasks_emp.groupby("EmployeeID").agg(
    total_actual_hours=("ActualHours", "sum"),
    total_planned_hours=("PlannedHours", "sum"),
    task_count=("TaskID", "count"),
    labour_cost=("LabourCost", "sum"),
).reset_index()
workload = workload.merge(emp[["EmployeeID","FullName","Role","ExperienceLevel"]], on="EmployeeID", how="left")
workload["HoursEfficiency"] = workload["total_planned_hours"] / workload["total_actual_hours"]

summary["employee_workload_stats"] = {
    "avg_actual_hours_per_employee": round(workload["total_actual_hours"].mean(), 1),
    "max_actual_hours": float(workload["total_actual_hours"].max()),
    "min_actual_hours": float(workload["total_actual_hours"].min()),
}
summary["top_workload_employees"] = [
    clean_dict(r) for r in
    workload.nlargest(10, "total_actual_hours")[["EmployeeID","FullName","Role","ExperienceLevel","total_actual_hours","labour_cost"]].to_dict("records")
]

# ── 11. Milestone KPIs ────────────────────────────────────────────────────────
ms_done = ms[ms["Status"] == "Completed"].copy()
ms_done["DelayDays"] = (ms_done["ActualCompletionDate"] - ms_done["PlannedCompletionDate"]).dt.days
ms_on_time = (ms_done["DelayDays"] <= 0).sum()

summary["milestone_kpis"] = {
    "total_milestones": int(len(ms)),
    "completed_milestones": int(len(ms_done)),
    "on_time_milestones": int(ms_on_time),
    "milestone_on_time_rate_pct": round(ms_on_time / len(ms_done) * 100, 1) if len(ms_done) else None,
    "avg_delay_days": round(ms_done.loc[ms_done["DelayDays"] > 0, "DelayDays"].mean(), 1) if len(ms_done) else None,
}

# Milestone status distribution
summary["milestone_status"] = {k: int(v) for k, v in ms["Status"].value_counts().items()}

# ── 12. Per-project summary table ─────────────────────────────────────────────
proj_tasks = tasks.groupby("ProjectID").agg(
    task_count=("TaskID","count"),
    completed_tasks=("TaskID", lambda x: (tasks.loc[x.index,"TaskStatus"]=="Completed").sum()),
    total_actual_hours=("ActualHours","sum"),
    total_planned_hours=("PlannedHours","sum"),
).reset_index()

proj_ms = ms.groupby("ProjectID").agg(
    milestone_count=("MilestoneID","count"),
    completed_milestones=("MilestoneID", lambda x: (ms.loc[x.index,"Status"]=="Completed").sum()),
).reset_index()

proj_labour = labour_by_project[["ProjectID","LabourCost"]]

proj_full = (proj
    .merge(proj_tasks, on="ProjectID", how="left")
    .merge(proj_ms, on="ProjectID", how="left")
    .merge(proj_labour, on="ProjectID", how="left")
)

completed_full = proj_full[proj_full["Status"]=="Completed"].copy()
completed_full["ScheduleVarianceDays"] = (
    completed_full["ActualEndDate"] - completed_full["PlannedEndDate"]
).dt.days

all_proj_rows = proj_full.copy()
all_proj_rows["ScheduleVarianceDays"] = (
    all_proj_rows["ActualEndDate"] - all_proj_rows["PlannedEndDate"]
).dt.days

cols = ["ProjectID","ProductName","DepartmentID","City","Project_Country",
        "Project_Country_Latitude","Project_Country_Longitude",
        "Status","RiskLevel","CompletionPercentage","PlannedBudget","ActualBudget",
        "BudgetVariance","BudgetVariancePct","ScheduleVarianceDays",
        "task_count","completed_tasks","total_actual_hours","total_planned_hours",
        "milestone_count","completed_milestones","LabourCost",
        "PlannedStartDate","PlannedEndDate","ActualStartDate","ActualEndDate"]
all_proj_rows = all_proj_rows[[c for c in cols if c in all_proj_rows.columns]]

def row_clean(r):
    out = {}
    for k, v in r.items():
        if isinstance(v, pd.Timestamp):
            out[k] = v.isoformat() if pd.notna(v) else None
        elif isinstance(v, float) and np.isnan(v):
            out[k] = None
        elif isinstance(v, np.integer):
            out[k] = int(v)
        elif isinstance(v, np.floating):
            out[k] = None if np.isnan(v) else float(v)
        else:
            out[k] = v
    return out

summary["projects_detail"] = [row_clean(r) for r in all_proj_rows.to_dict("records")]

# ── Write output ──────────────────────────────────────────────────────────────
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2, default=str)

print(f"summary.json written ({OUT.stat().st_size // 1024} KB)")

# ── Print analysis highlights ─────────────────────────────────────────────────
print("\n====== DATA ANALYSIS HIGHLIGHTS ======\n")
c = summary["counts"]
print(f"Dataset: {c['total_projects']} projects | {c['total_tasks']} tasks | "
      f"{c['total_employees']} employees | {c['total_milestones']} milestones")

print("\n--- Project Status ---")
for k,v in summary["project_status"].items():
    pct = round(v/c['total_projects']*100,1)
    print(f"  {k}: {v} ({pct}%)")

print("\n--- Risk Level ---")
for k,v in summary["project_risk"].items():
    pct = round(v/c['total_projects']*100,1)
    print(f"  {k}: {v} ({pct}%)")

b = summary["budget_kpis"]
print(f"\n--- Budget KPIs ---")
print(f"  Total Planned: EUR {b['total_planned_budget']:,.0f}")
print(f"  Total Actual:  EUR {b['total_actual_budget']:,.0f}")
print(f"  Total Variance: EUR {b['total_budget_variance']:+,.0f}")
print(f"  Over-budget projects: {b['over_budget_count']} ({b['over_budget_rate_pct']}%)")
print(f"  Avg budget variance: {b['avg_budget_variance_pct']:+.1f}%")

s = summary["schedule_kpis"]
print(f"\n--- Schedule KPIs ---")
print(f"  Completed: {s['completed_projects']} | On-time: {s['on_time_count']} ({s['on_time_delivery_rate_pct']}%)")
print(f"  Avg schedule variance: {s['avg_schedule_variance_days']:+.1f} days")
print(f"  Avg completion % (active): {s['avg_completion_pct_active']}%")

t = summary["task_kpis"]
print(f"\n--- Task KPIs ---")
print(f"  Completion rate: {t['task_completion_rate_pct']}%")
print(f"  Blocked rate: {t['blocked_task_rate_pct']}%")
print(f"  Avg hours variance: {t['avg_hours_variance']:+.1f} hrs/task")

m = summary["milestone_kpis"]
print(f"\n--- Milestone KPIs ---")
print(f"  On-time rate: {m['milestone_on_time_rate_pct']}%")
print(f"  Avg delay (late milestones): {m['avg_delay_days']} days")

print(f"\n--- Labour by Experience ---")
for r in summary["labour_by_experience"]:
    print(f"  {r['ExperienceLevel']:8s}: avg EUR {r['avg_hourly_rate']:.0f}/hr | "
          f"total cost EUR {r['total_labour_cost']:,.0f} | {r['employee_count']} employees")

print("\n--- Budget Variance by Department ---")
for r in sorted(summary["budget_by_department"], key=lambda x: -abs(x.get("avg_variance_pct") or 0)):
    print(f"  {r['Department_Name']:30s}: {r['projects']} projects | avg variance {r['avg_variance_pct']:+.1f}%")

print("\n--- Top 5 Over-budget Projects ---")
proj_over = [p for p in summary["projects_detail"] if (p.get("BudgetVariance") or 0) > 0]
proj_over.sort(key=lambda x: -(x.get("BudgetVariance") or 0))
for p in proj_over[:5]:
    print(f"  {p['ProjectID']} {p['ProductName']:20s} {p['City']:15s} +EUR {p['BudgetVariance']:,.0f} ({p['BudgetVariancePct']:+.1f}%)")

print("\n--- Top 5 Delayed Projects (by schedule variance) ---")
proj_late = [p for p in summary["projects_detail"] if (p.get("ScheduleVarianceDays") or 0) > 0]
proj_late.sort(key=lambda x: -(x.get("ScheduleVarianceDays") or 0))
for p in proj_late[:5]:
    print(f"  {p['ProjectID']} {p['ProductName']:20s} {p['City']:15s} +{p['ScheduleVarianceDays']} days")

print("\nDone - generate_summary.py")
