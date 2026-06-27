# Skill: fintech-context

## Purpose
Injects the FinTech dashboard project context so Claude always codes in alignment with the data model, KPIs, page structure, and conventions defined in CLAUDE.md.

---

## Project at a Glance

**What we're building:** A React 18 + TypeScript + Vite interactive dashboard that analyzes a FinTech project-management dataset from a European payment solutions company.

**Stack:** React 18 / TypeScript / Vite · Recharts · Leaflet · TanStack Table v8 · CSS Modules · Python (pandas/openpyxl) for data pipeline · Vitest for tests.

**Source data:** `data/raw/Fintech Projects Dataset.xlsx` (5 sheets) + `data/raw/World Flags Dataset Addition.xlsx` (1 sheet).

---

## Data Model (5 entities + flags)

| Entity | Key columns |
|--------|-------------|
| **Projects** | ProjectID (PK), ProductName, DepartmentID, ProjectManagerID, City, Lat/Lng, PlannedStart/EndDate, ActualStart/EndDate, Status, PlannedBudget, ActualBudget, RiskLevel, CompletionPercentage, Project_Country |
| **Tasks** | TaskID (PK), ProjectID (FK), AssignedTo/EmployeeID (FK), TaskName, PlannedHours, ActualHours, TaskStatus, Priority |
| **Employees** | EmployeeID (PK), FullName, DepartmentID (FK), Role, ExperienceLevel, Country, City, Lat/Lng, HourlyRate |
| **Departments** | Department_ID (PK), Department_Name, Head_Of_Department |
| **Milestones** | MilestoneID (PK), ProjectID (FK), MilestoneName, PlannedCompletionDate, ActualCompletionDate, Status |
| **World Flags** | Country (join key), Alpha Code, Flat/Shiny/Circle Flag URLs |

**Relationship chain:**
```
Departments ──< Projects ──< Tasks
                   │              └── Employees
                   └──< Milestones
Projects.Project_Country → World Flags.Country
```

---

## Data Quality Rules

- `Project_Country` has `#VALUE!` errors — derive from City lookup during cleaning
- Dates are strings `dd/MM/yyyy` — always parse explicitly
- `ActualEndDate` / `ActualCompletionDate` are null until completion
- Employees sheet has trailing empty columns past col J — ignore them
- Employee lat/lng are strings — cast to float

---

## Core KPIs

| KPI | Formula |
|-----|---------|
| Budget Variance (EUR) | ActualBudget − PlannedBudget |
| Budget Variance (%) | (ActualBudget − PlannedBudget) / PlannedBudget × 100 |
| Schedule Variance (days) | ActualEndDate − PlannedEndDate |
| On-Time Delivery Rate | % Completed projects where ActualEndDate ≤ PlannedEndDate |
| Over-Budget Rate | % projects where ActualBudget > PlannedBudget |
| Hours Efficiency | PlannedHours / ActualHours |
| Blocked Task Rate | (On Hold + Review Required) / Total tasks |
| Labour Cost | ActualHours × HourlyRate per employee |
| Milestone On-Time Rate | % Completed milestones with ActualDate ≤ PlannedDate |

---

## Dashboard Pages

| Page | Route | Focus |
|------|-------|-------|
| Overview | `/` | Executive KPI cards, status donut, budget bar, geo map |
| Projects | `/projects` | Filterable table, Gantt-style timeline, milestone tracker |
| Performance | `/performance` | On-time trend, budget variance by dept/city, blocked task heatmap |
| Analytics | `/analytics` | Labour cost by role/experience, workload, hourly rate distribution |

Global filters (status, department, risk level, date range) apply across all charts on each page.

---

## File Map

| Path | Role |
|------|------|
| `scripts/parse_excel.py` | xlsx → raw JSON per sheet |
| `scripts/clean_data.py` | Fix errors, parse dates, join flags |
| `scripts/generate_summary.py` | Pre-aggregate KPIs → `summary.json` |
| `src/types/project.ts` | TS interfaces for all 5 entities |
| `src/types/dashboard.ts` | KPI result types, chart data shapes |
| `src/utils/dataTransform.ts` | Joins, derived metrics at runtime |
| `src/utils/formatters.ts` | EUR currency, dates (DD MMM YYYY), % |
| `src/utils/constants.ts` | Status/risk colour maps, filter options |
| `src/hooks/useData.ts` | Fetch & cache processed JSON |
| `src/hooks/useFilters.ts` | Global filter state |
| `src/context/DashboardContext.tsx` | Data provider |
| `src/context/FilterContext.tsx` | Filter state provider |

---

## Conventions (always follow)

- Money → `€1,234,567` (EUR, no decimals for display)
- Dates → `DD MMM YYYY` (e.g. `07 May 2026`)
- Status colours: Completed=green · In Progress=blue · On Hold=amber · Delayed=red
- Risk colours: Low=green · Medium=amber · High=red
- Every chart has a tooltip with exact values
- Filters are global per page — never siloed to a single component
- Data pipeline output lives in `data/processed/clean/*.json` and `data/processed/summary.json`
