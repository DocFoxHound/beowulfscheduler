import React from "react";
// import "./Navbar.css"; // (Optional: create this for navbar-specific styles)

const Navbar: React.FC = () => (
  <header className="navbar">
    <div className="navbar-title">IronPoint</div>
    <nav className="navbar-links">
      <a href="/dashboard">Dashboard</a>
      <a href="/piracy">Piracy</a>
      <a href="/fleets">Fleets</a>
      <a href="/scheduler">Training Scheduler</a>
      <a href="/warehouse">Warehouse</a>
    </nav>
  </header>
);

export default Navbar;