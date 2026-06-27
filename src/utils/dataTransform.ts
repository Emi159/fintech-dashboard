import type { ProjectDetail, FilterState } from "../types/dashboard";

export function applyFilters(
  projects: ProjectDetail[],
  filters: FilterState,
): ProjectDetail[] {
  return projects.filter((p) => {
    if (filters.status.length > 0 && !filters.status.includes(p.Status))
      return false;
    if (
      filters.riskLevel.length > 0 &&
      !filters.riskLevel.includes(p.RiskLevel)
    )
      return false;
    if (
      filters.department.length > 0 &&
      !filters.department.includes(p.DepartmentID)
    )
      return false;
    if (
      filters.dateFrom &&
      p.PlannedStartDate &&
      p.PlannedStartDate < filters.dateFrom
    )
      return false;
    if (filters.dateTo && p.PlannedEndDate && p.PlannedEndDate > filters.dateTo)
      return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !p.ProductName.toLowerCase().includes(q) &&
        !p.City.toLowerCase().includes(q) &&
        !p.Project_Country.toLowerCase().includes(q) &&
        !p.ProjectID.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

export function recordToChartData(
  record: Record<string, number>,
): { name: string; value: number }[] {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

export function budgetChartData(
  projects: ProjectDetail[],
): { name: string; planned: number; actual: number }[] {
  return projects.slice(0, 15).map((p) => ({
    name: p.ProductName,
    planned: p.PlannedBudget,
    actual: p.ActualBudget,
  }));
}

export function completionOverTime(
  projects: ProjectDetail[],
): { month: string; completed: number; delayed: number }[] {
  const monthly: Record<string, { completed: number; delayed: number }> = {};
  projects.forEach((p) => {
    if (!p.ActualEndDate) return;
    const month = p.ActualEndDate.slice(0, 7);
    monthly[month] ??= { completed: 0, delayed: 0 };
    if (p.Status === "Completed") monthly[month].completed++;
    if (p.Status === "Delayed") monthly[month].delayed++;
  });
  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));
}
