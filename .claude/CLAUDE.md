# FinTech Project Management Dashboard — CLAUDE.md

## Project Overview

This project builds an interactive web dashboard to analyze a **FinTech Project Management** dataset from a European payment solutions company. The dataset covers how product development projects (e-wallets, tap-to-pay systems, online payment APIs) are planned, executed, and monitored across multiple European cities and departments.

**Primary goal:** Surface insights that improve project delivery performance, resource allocation, and budget efficiency.

**Source files:**

- `data/raw/Fintech Projects Dataset.xlsx` — 5 sheets: Projects, Tasks, Employees, Departments, Milestones
- `data/raw/World Flags Dataset Addition.xlsx` — 1 sheet: Banderas (country flag URLs)
- `Instruction.docx` — challenge brief (Vietnamese)

---

## Data Model

### Relationships

```
Departments (D_ID) ──< Projects (DepartmentID) ──< Tasks (ProjectID)
                                │                        │
                       ProjectManagerID          AssignedTo (EmployeeID)
                                │                        │
                          Employees (EmployeeID) >───────┘
                                │
                          DepartmentID >── Departments

Projects (ProjectID) ──< Milestones (ProjectID)

Projects (Project_Country) >── World Flags (Country)  [for map visuals]
```

### Sheet: Projects

| Column                    | Type                    | Notes                                       |
| ------------------------- | ----------------------- | ------------------------------------------- |
| ProjectID                 | string PK               | e.g. P001                                   |
| ProductName               | string                  | e.g. InstantPay, EuroWallet                 |
| DepartmentID              | string FK → Departments |                                             |
| ProjectManagerID          | string FK → Employees   |                                             |
| City                      | string                  | European city                               |
| Project_Country_Latitude  | float                   | For map visuals                             |
| Project_Country_Longitude | float                   | For map visuals                             |
| PlannedStartDate          | date                    | dd/MM/yyyy                                  |
| PlannedEndDate            | date                    |                                             |
| ActualStartDate           | date                    |                                             |
| ActualEndDate             | date                    | null if in progress                         |
| Status                    | string                  | In Progress / Completed / On Hold / Delayed |
| PlannedBudget (EUR)       | float                   |                                             |
| ActualBudget (EUR)        | float                   |                                             |
| RiskLevel                 | string                  | Low / Medium / High                         |
| CompletionPercentage      | float                   | 0–100                                       |
| Project_Country           | string                  | Has `#VALUE!` errors — needs cleaning       |

### Sheet: Tasks

| Column                  | Type                  | Notes                                               |
| ----------------------- | --------------------- | --------------------------------------------------- |
| TaskID                  | string PK             | e.g. T0001                                          |
| ProjectID               | string FK → Projects  |                                                     |
| AssignedTo (EmployeeID) | string FK → Employees |                                                     |
| TaskName                | string                |                                                     |
| PlannedHours            | float                 |                                                     |
| ActualHours             | float                 |                                                     |
| TaskStatus              | string                | In Progress / Completed / On Hold / Review Required |
| Priority                | string                | Low / Medium / High                                 |

### Sheet: Employees

| Column                     | Type                    | Notes                          |
| -------------------------- | ----------------------- | ------------------------------ |
| EmployeeID                 | string PK               | e.g. E001                      |
| FullName                   | string                  |                                |
| DepartmentID               | string FK → Departments |                                |
| Role                       | string                  | e.g. Data Analyst, UX Designer |
| ExperienceLevel            | string                  | Junior / Mid / Senior          |
| Country                    | string                  |                                |
| City                       | string                  |                                |
| Employee_Country_Latitude  | string                  | Cast to float                  |
| Employee_Country_Longitude | string                  | Cast to float                  |
| HourlyRate (EUR/hour)      | float                   |                                |

### Sheet: Departments

| Column             | Type      | Notes                                |
| ------------------ | --------- | ------------------------------------ |
| Department_ID      | string PK | e.g. D01                             |
| Department_Name    | string    | e.g. Product Management, Engineering |
| Head_Of_Department | string    |                                      |

### Sheet: Milestones

| Column                | Type                 | Notes                                  |
| --------------------- | -------------------- | -------------------------------------- |
| MilestoneID           | string PK            | e.g. M0001                             |
| ProjectID             | string FK → Projects |                                        |
| MilestoneName         | string               | e.g. Requirements & Scoping, MVP Ready |
| PlannedCompletionDate | date                 | dd/MM/yyyy                             |
| ActualCompletionDate  | date                 | null if not yet completed              |
| Status                | string               | Completed / On Track / Delayed         |

### Sheet: World Flags (Banderas)

| Column      | Type   | Notes                                |
| ----------- | ------ | ------------------------------------ |
| Country     | string | Join key to Projects.Project_Country |
| Alpha Code  | string | ISO 2-letter code                    |
| Flat Flag   | URL    | flagsapi.com flat PNG                |
| Shiny Flag  | URL    | flagsapi.com shiny PNG               |
| Circle Flag | URL    | hatscripts SVG                       |

---

## Known Data Quality Issues

- `Project_Country` column contains `#VALUE!` formula errors — must be resolved during data cleaning (derive from City or geocoding lookup)
- `ActualEndDate` is null for in-progress projects
- `ActualCompletionDate` is null for incomplete milestones
- `Employees` sheet has trailing empty columns past column J — ignore them
- Dates stored as strings `dd/MM/yyyy` — parse explicitly

---

## KPIs & Metrics to Build

### Project-level

| KPI                      | Formula                                                     |
| ------------------------ | ----------------------------------------------------------- |
| Budget Variance (EUR)    | ActualBudget − PlannedBudget                                |
| Budget Variance (%)      | (ActualBudget − PlannedBudget) / PlannedBudget × 100        |
| Schedule Variance (days) | ActualEndDate − PlannedEndDate (positive = late)            |
| On-Time Delivery Rate    | % of Completed projects with ActualEndDate ≤ PlannedEndDate |
| Over-Budget Rate         | % of projects where ActualBudget > PlannedBudget            |
| Avg Completion %         | Mean CompletionPercentage across active projects            |

### Task-level

| KPI                  | Formula                                      |
| -------------------- | -------------------------------------------- |
| Hours Variance       | ActualHours − PlannedHours                   |
| Hours Efficiency     | PlannedHours / ActualHours (>1 = under time) |
| Task Completion Rate | Completed tasks / Total tasks per project    |
| Blocked Task Rate    | (On Hold + Review Required) / Total tasks    |
| Labour Cost (EUR)    | ActualHours × HourlyRate per employee        |

### Employee / Resource

| KPI                           | Formula                                        |
| ----------------------------- | ---------------------------------------------- |
| Cost per Project              | Sum of Labour Cost across all tasks in project |
| Avg Hourly Rate by Experience | GROUP BY ExperienceLevel                       |
| Workload per Employee         | Sum of ActualHours assigned                    |

### Milestone

| KPI                        | Formula                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| Milestone On-Time Rate     | Completed milestones with ActualCompletionDate ≤ PlannedCompletionDate |
| Avg Milestone Delay (days) | Mean of (ActualCompletionDate − PlannedCompletionDate) where delayed   |

---

## Dashboard Pages

### 1. Overview (src/pages/Overview)

High-level executive summary.

- KPI cards: Total Projects, Active Projects, Avg Completion %, On-Time Rate, Over-Budget Rate
- Project status distribution (donut chart)
- Risk level breakdown (bar chart)
- Budget planned vs actual (grouped bar)
- Projects map by city/country (geo scatter)

### 2. Projects (src/pages/Projects)

Detailed project browser.

- Filterable table: status, department, risk level, date range
- Timeline / Gantt-style view (planned vs actual dates)
- Per-project: budget variance, schedule variance, completion %
- Milestone progress tracker per project

### 3. Performance (src/pages/Performance)

Delivery and efficiency analysis.

- On-time delivery rate over time
- Budget variance by department and city
- Task hours planned vs actual (scatter)
- Blocked/stalled task heatmap by project and status
- Top delayed projects

### 4. Analytics (src/pages/Analytics)

Resource and cost deep-dive.

- Labour cost by department, role, experience level
- Hourly rate distribution by experience (box plot or violin)
- Employee workload vs efficiency
- Correlation: experience level → hours variance
- Milestone completion rate by department

---

## Analysis Questions

1. Which projects are on track, and which are at risk of delay or budget overrun?
2. How do project duration, milestone completion, and work performance relate to overall success?
3. How do hourly rate and experience level affect project costs and speed?
4. Are certain departments or cities consistently better at meeting deadlines?
5. Which task statuses or phases most often cause delays or rework?
6. Can early project data (first milestone, initial task completion) predict later delays or budget issues?

---

## Tech Stack

| Layer              | Choice                            |
| ------------------ | --------------------------------- |
| Frontend framework | React 18 + TypeScript             |
| Build tool         | Vite                              |
| Charts             | Recharts (primary) or Chart.js    |
| Map                | Leaflet + react-leaflet           |
| Table              | TanStack Table v8                 |
| Styling            | CSS Modules + CSS variables       |
| Data pipeline      | Python (openpyxl / pandas) → JSON |
| State/context      | React Context API                 |
| Testing            | Vitest + React Testing Library    |

---

## File Responsibilities

| File                               | Purpose                                                   |
| ---------------------------------- | --------------------------------------------------------- |
| `scripts/parse_excel.py`           | Read xlsx, output raw JSON per sheet to `data/processed/` |
| `scripts/clean_data.py`            | Fix `#VALUE!` errors, parse dates, cast types, join flags |
| `scripts/generate_summary.py`      | Pre-compute KPI aggregations for faster dashboard load    |
| `src/utils/dataTransform.ts`       | Runtime data joins and derived metric calculations        |
| `src/utils/formatters.ts`          | Currency (EUR), percentage, date, number formatters       |
| `src/utils/constants.ts`           | Status colours, risk level colours, filter options        |
| `src/types/project.ts`             | TypeScript interfaces for all 5 data entities             |
| `src/types/dashboard.ts`           | KPI result types, chart data shapes                       |
| `src/hooks/useData.ts`             | Load and cache processed JSON data                        |
| `src/hooks/useFilters.ts`          | Global filter state (status, dept, date range, risk)      |
| `src/hooks/useChartOptions.ts`     | Shared chart config (colours, axes, tooltips)             |
| `src/context/DashboardContext.tsx` | Provide loaded data to all pages                          |
| `src/context/FilterContext.tsx`    | Provide filter state to all components                    |

---

## Data Pipeline Order

```
data/raw/*.xlsx
    → scripts/parse_excel.py    → data/processed/{projects,tasks,employees,departments,milestones,flags}.json
    → scripts/clean_data.py     → data/processed/clean/*.json
    → scripts/generate_summary.py → data/processed/summary.json
    → src/hooks/useData.ts      (runtime fetch)
```

---

## Conventions

- All monetary values in EUR, formatted as `€1,234,567`
- All dates displayed as `DD MMM YYYY` (e.g. `07 May 2026`)
- Colour coding for status: `Completed` green, `In Progress` blue, `On Hold` amber, `Delayed` red
- Colour coding for risk: `Low` green, `Medium` amber, `High` red
- All charts must have a tooltip with exact values
- Filters apply globally across all chart components on the same page

---

## Deployment: GitHub Pages

After the dashboard is complete, deploy it as a public website via GitHub Pages:

### Steps

1. **Initialize git** in the project root (`git init`) if not already done.
2. **Create a new GitHub repository** at github.com (name suggestion: `fintech-dashboard`) — keep it public so Pages is free.
3. **Connect the local repo** to the remote:
   ```bash
   git remote add origin https://github.com/<username>/<repo-name>.git
   ```
4. **Configure Vite for GitHub Pages** — set `base` in `vite.config.ts` to the repo name:
   ```ts
   export default defineConfig({
     base: "/<repo-name>/",
     // ...rest of config
   });
   ```
5. **Add the `gh-pages` deploy script** — install the package and add npm scripts:
   ```bash
   npm install --save-dev gh-pages
   ```
   In `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
6. **Commit all changes**, then push to `main`:
   ```bash
   git add .
   git commit -m "initial dashboard"
   git push -u origin main
   ```
7. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```
   This builds the app and pushes the `dist/` folder to the `gh-pages` branch automatically.
8. **Enable Pages in GitHub** — go to the repo Settings → Pages → Source: `gh-pages` branch, `/ (root)`. The live URL will be `https://<username>.github.io/<repo-name>/`.

### Notes

- All JSON data files under `data/processed/` must be included in the build output (copy to `public/data/` so Vite serves them as static assets).
- `useData.ts` fetch paths must use relative URLs compatible with the `base` path set above.
- Re-run `npm run deploy` after any future changes to publish updates.
