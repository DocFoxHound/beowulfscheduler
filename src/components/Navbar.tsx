import React, { useState } from "react";

interface NavbarProps {
  dbUser?: { roles?: string[] };
}

const BLOODED_PLUS_IDS = (import.meta.env.VITE_LIVE_BLOODED_PLUS || "").split(",");

const Navbar: React.FC<NavbarProps> = ({ dbUser }) => {
  const [adminOpen, setAdminOpen] = useState(false);

  const isAdmin =
    dbUser &&
    Array.isArray(dbUser.roles) &&
    dbUser.roles.some((roleId: string) => BLOODED_PLUS_IDS.includes(roleId));

  return (
    <header className="navbar">
      <div className="navbar-title">IronPoint</div>
      <nav className="navbar-links" style={{ display: "flex", alignItems: "center" }}>
        <a href="/dashboard">Dashboard</a>
        <a href="/piracy">Piracy</a>
        <a href="/fleets">Fleets</a>
        <a href="/warehouse">Warehouse</a>
        <a href="/scheduler">Scheduler</a>
        <a href="/leaderboards">Leaderboards</a>
        <a href="/info">About</a>
        {isAdmin && (
          <div
            className="navbar-dropdown"
            style={{ position: "relative", marginLeft: "1.5rem" }}
            onMouseEnter={() => setAdminOpen(true)}
            onMouseLeave={() => setAdminOpen(false)}
          >
            <button
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "1rem",
                padding: "0.5rem 1rem",
              }}
            >
              Admin ▼
            </button>
            {adminOpen && (
              <div
                className="navbar-dropdown-menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  background: "#23272a",
                  border: "1px solid #444",
                  borderRadius: 6,
                  minWidth: 140,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  zIndex: 100,
                }}
              >
                <a href="/admin/activity" style={{ display: "block", padding: "0.5rem 1rem", color: "#fff", textDecoration: "none" }}>Activity</a>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;