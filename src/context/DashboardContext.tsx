import { createContext, useContext, type ReactNode } from "react";
import { useData } from "../hooks/useData";
import type { DashboardSummary } from "../types/dashboard";

interface DashboardContextValue {
  summary: DashboardSummary | null;
  flagMap: Record<string, string>;
  loading: boolean;
  error: string | null;
}

export const DashboardContext = createContext<DashboardContextValue | null>(
  null,
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { summary, flagMap, loading, error } = useData();
  return (
    <DashboardContext.Provider value={{ summary, flagMap, loading, error }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
