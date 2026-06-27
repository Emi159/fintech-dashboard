import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SummaryCard({
  title,
  children,
  className = "",
}: SummaryCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="card__title">{title}</div>
      {children}
    </div>
  );
}
