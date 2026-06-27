import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Overview", icon: "▦" },
  { to: "/projects", label: "Projects", icon: "◫" },
  { to: "/performance", label: "Performance", icon: "◈" },
  { to: "/analytics", label: "Analytics", icon: "◉" },
];

export function Sidebar() {
  return (
    <aside className="layout__sidebar">
      <div className="sidebar__brand">
        FinTech Dashboard
        <span>Project Management</span>
      </div>
      <nav className="sidebar__nav">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
