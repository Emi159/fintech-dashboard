import { useState, useEffect } from "react";
import type { DashboardSummary } from "../types/dashboard";

interface FlagEntry {
  Country: string;
  "Alpha Code": string;
  "Circle Flag": string;
}

interface UseDataResult {
  summary: DashboardSummary | null;
  flagMap: Record<string, string>;
  loading: boolean;
  error: string | null;
}

let summaryCache: DashboardSummary | null = null;
let flagMapCache: Record<string, string> | null = null;

export function useData(): UseDataResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(summaryCache);
  const [flagMap, setFlagMap] = useState<Record<string, string>>(
    flagMapCache ?? {},
  );
  const [loading, setLoading] = useState(summaryCache === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (summaryCache && flagMapCache) return;
    setLoading(true);

    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/summary.json`).then(
        (r) => r.json() as Promise<DashboardSummary>,
      ),
      fetch(`${import.meta.env.BASE_URL}data/clean/flags.json`).then(
        (r) => r.json() as Promise<FlagEntry[]>,
      ),
    ])
      .then(([data, flags]) => {
        summaryCache = data;
        flagMapCache = Object.fromEntries(
          flags.map((f) => [f["Alpha Code"].toUpperCase(), f["Circle Flag"]]),
        );
        setSummary(data);
        setFlagMap(flagMapCache);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { summary, flagMap, loading, error };
}
