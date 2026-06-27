# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project State

The project is in early scaffolding. Almost all `src/` files and Python scripts are empty stubs — the full specification lives in `.claude/CLAUDE.md`. Build commands and dependencies below reflect the **intended** setup; install them before running.

---

## Setup

### Frontend
```bash
npm install
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint
npm run test       # Vitest (watch mode)
npm run test:run   # Vitest (single run)
```

Expected `package.json` dependencies to add:
- `react`, `react-dom`, `react-router-dom`
- `recharts`, `leaflet`, `react-leaflet`
- `@tanstack/react-table`
- Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@testing-library/react`, `eslint`

### Python data pipeline
```bash
# From project root — run in order:
python scripts/parse_excel.py      # → data/processed/*.json
python scripts/clean_data.py       # → data/processed/clean/*.json
python scripts/generate_summary.py # → data/processed/summary.json
```

Required packages: `openpyxl`, `pandas`

---

## Architecture

```
data/raw/*.xlsx
  └─► scripts/ (Python ETL)
        └─► data/processed/clean/*.json + summary.json
              └─► src/hooks/useData.ts  (fetch + cache at runtime)
                    └─► DashboardContext  (provides to all pages)
                          └─► FilterContext  (global filter state)
                                └─► pages/ (Overview, Projects, Performance, Analytics)
                                      └─► components/ (charts, cards, tables, filters)
```

### Key data flow decisions
- **ETL is offline**: Python scripts run once and output static JSON; the React app never calls Python at runtime.
- **Summary JSON**: `generate_summary.py` pre-computes KPI aggregates so the dashboard avoids re-computing over raw rows on every render.
- **Filter state** lives in `FilterContext` (not per-page state) so filters applied on one page persist across navigation.
- **Data joins** happen in `src/utils/dataTransform.ts` at runtime (e.g. linking Tasks → Employees for labour cost).

### Component structure
```
src/components/
  cards/      KpiCard, SummaryCard
  charts/     BarChart, LineChart, PieChart (wrappers over Recharts)
  filters/    CategoryFilter, DateRangeFilter
  layout/     Header, Sidebar, MainLayout
  tables/     ProjectsTable (TanStack Table)
```

Pages are under `src/pages/{Overview,Projects,Performance,Analytics}/index.tsx`.

### Important data quirks to handle
- `Project_Country` column in the raw xlsx has `#VALUE!` formula errors — `clean_data.py` must derive country from `City`.
- Dates in xlsx are strings `dd/MM/yyyy` — parse with `pd.to_datetime(..., dayfirst=True)`.
- `ActualEndDate` / `ActualCompletionDate` are null for in-progress items — never assume they exist.
