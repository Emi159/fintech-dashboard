import { useLocation } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/projects": "Projects",
  "/performance": "Performance",
  "/analytics": "Analytics",
};

export function Header() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="layout__header header">
      <h1 className="header__title">{title}</h1>
      <span className="header__meta">
        European FinTech Payment Solutions · 72 Projects
      </span>
    </header>
  );
}
