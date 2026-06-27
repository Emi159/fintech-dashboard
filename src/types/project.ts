export interface Project {
  ProjectID: string;
  ProductName: string;
  DepartmentID: string;
  ProjectManagerID: string;
  City: string;
  Project_Country: string;
  Project_Country_Latitude: number;
  Project_Country_Longitude: number;
  PlannedStartDate: string | null;
  PlannedEndDate: string | null;
  ActualStartDate: string | null;
  ActualEndDate: string | null;
  Status: ProjectStatus;
  PlannedBudget: number;
  ActualBudget: number;
  RiskLevel: RiskLevel;
  CompletionPercentage: number;
}

export interface Task {
  TaskID: string;
  ProjectID: string;
  EmployeeID: string;
  TaskName: string;
  PlannedHours: number;
  ActualHours: number;
  TaskStatus: TaskStatus;
  Priority: Priority;
}

export interface Employee {
  EmployeeID: string;
  FullName: string;
  DepartmentID: string;
  Role: string;
  ExperienceLevel: ExperienceLevel;
  Country: string;
  City: string;
  Employee_Country_Latitude: number;
  Employee_Country_Longitude: number;
  HourlyRate: number;
}

export interface Department {
  Department_ID: string;
  Department_Name: string;
  Head_Of_Department: string;
}

export interface Milestone {
  MilestoneID: string;
  ProjectID: string;
  MilestoneName: string;
  PlannedCompletionDate: string | null;
  ActualCompletionDate: string | null;
  Status: MilestoneStatus;
}

export interface Flag {
  Country: string;
  "Alpha Code": string;
  "Flat Flag": string;
  "Shiny Flag": string;
  "Circle Flag": string;
}

export type ProjectStatus =
  | "In Progress"
  | "Completed"
  | "Delayed"
  | "On Hold"
  | "Not Started";
export type RiskLevel = "Low" | "Medium" | "High";
export type TaskStatus =
  | "In Progress"
  | "Completed"
  | "On Hold"
  | "Review Required";
export type Priority = "Low" | "Medium" | "High";
export type ExperienceLevel = "Junior" | "Mid" | "Senior";
export type MilestoneStatus = "Completed" | "On Track" | "Delayed";
