import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css"; // Reuse the same styles

export default function Scheduler() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/user", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  if (!user) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="navbar-title">IronPoint</div>
        <nav className="navbar-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/charts">Charts</a>
          <a href="/scheduler">Beowulf Scheduler</a>
          <a href="/hittracker">Hits</a>
          <a href="/settings">Settings</a>
          <a href="/logout" className="logout-link">Logout</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Scheduler</h1>
          <p>Create and manage your upcoming mission schedules.</p>
        </section>

        {/* Filler for calendar/scheduling UI */}
        <section className="dashboard-grid">
          <div className="card">
            <h2>📅 Upcoming Event</h2>
            <p>You have no scheduled missions.</p>
          </div>

          <div className="card">
            <h2>➕ New Schedule</h2>
            <p>Use this section to add a new mission or training slot.</p>
          </div>

          <div className="card">
            <h2>🕒 Time Zones</h2>
            <p>All times are shown in your local time zone (auto-detected).</p>
          </div>
        </section>
      </main>
    </div>
  );
}