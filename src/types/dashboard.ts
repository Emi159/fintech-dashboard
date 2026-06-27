export interface Counts {
  total_projects: number;
  total_tasks: number;
  total_employees: number;
  total_departments: number;
  total_milestones: number;
}

export interface BudgetKpis {
  total_planned_budget: number;
  total_actual_budget: number;
  total_budget_variance: number;
  over_budget_count: number;
  over_budget_rate_pct: number;
  avg_budget_variance_pct: number;
}

export interface ScheduleKpis {
  completed_projects: number;
  on_time_count: number;
  on_time_delivery_rate_pct: number;
  avg_schedule_variance_days: number;
  avg_completion_pct_active: number;
}

export interface TaskKpis {
  total_tasks: number;
  completed_tasks: number;
  task_completion_rate_pct: number;
  blocked_tasks: number;
  blocked_task_rate_pct: number;
  avg_hours_variance: number;
  total_planned_hours: number;
  total_actual_hours: number;
}

export interface MilestoneKpis {
  total_milestones: number;
  completed_milestones: number;
  on_time_milestones: number;
  milestone_on_time_rate_pct: number;
  avg_delay_days: number;
}

export interface BudgetByDept {
  Department_Name: string;
  projects: number;
  total_planned: number;
  total_actual: number;
  avg_variance_pct: number;
}

export interface BudgetByCountry {
  Project_Country: string;
  projects: number;
  total_planned: number;
  total_actual: number;
  avg_variance_pct: number;
}

export interface LabourByExperience {
  ExperienceLevel: string;
  avg_hourly_rate: number;
  total_labour_cost: number;
  total_actual_hours: number;
  employee_count: number;
}

export interface TopLabourProject {
  ProjectID: string;
  ProductName: string;
  Status: string;
  LabourCost: number;
}

export interface TopEmployee {
  EmployeeID: string;
  FullName: string;
  Role: string;
  ExperienceLevel: string;
  total_actual_hours: number;
  labour_cost: number;
}

export interface ProjectDetail {
  ProjectID: string;
  ProductName: string;
  DepartmentID: string;
  City: string;
  Project_Country: string;
  Project_Country_Latitude: number | null;
  Project_Country_Longitude: number | null;
  Status: string;
  RiskLevel: string;
  CompletionPercentage: number;
  PlannedBudget: number;
  ActualBudget: number;
  BudgetVariance: number;
  BudgetVariancePct: number;
  ScheduleVarianceDays: number | null;
  task_count: number;
  completed_tasks: number;
  total_actual_hours: number;
  total_planned_hours: number;
  milestone_count: number;
  completed_milestones: number;
  LabourCost: number | null;
  PlannedStartDate: string | null;
  PlannedEndDate: string | null;
  ActualStartDate: string | null;
  ActualEndDate: string | null;
}

export interface DashboardSummary {
  counts: Counts;
  project_status: Record<string, number>;
  project_risk: Record<string, number>;
  budget_kpis: BudgetKpis;
  schedule_kpis: ScheduleKpis;
  task_kpis: TaskKpis;
  task_status: Record<string, number>;
  task_priority: Record<string, number>;
  milestone_kpis: MilestoneKpis;
  milestone_status: Record<string, number>;
  budget_by_department: BudgetByDept[];
  budget_by_country: BudgetByCountry[];
  labour_by_experience: LabourByExperience[];
  top_labour_cost_projects: TopLabourProject[];
  top_workload_employees: TopEmployee[];
  employee_workload_stats: {
    avg_actual_hours_per_employee: number;
    max_actual_hours: number;
    min_actual_hours: number;
  };
  projects_detail: ProjectDetail[];
}

export interface FilterState {
  status: string[];
  riskLevel: string[];
  department: string[];
  dateFrom: string;
  dateTo: string;
  search: string;
}
