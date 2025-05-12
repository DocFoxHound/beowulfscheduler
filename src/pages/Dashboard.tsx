import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css"; // Add this if you're putting styles separately

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_USER_URL : import.meta.env.VITE_TEST_USER_URL}`, { withCredentials: true })
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

      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Welcome, {user.username}#{user.discriminator}</h1>
          <p>Here's an overview of your activity.</p>
          <img
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
            alt="User Avatar"
            className="avatar"
          />
        </section>

        <section className="dashboard-grid">
          <div className="card">
            <h2>Upcoming Missions</h2>
            <p>No missions scheduled. Stay sharp, Captain.</p>
          </div>

          <div className="card">
            <h2>Fleet Status</h2>
            <p>All ships are operational and docked.</p>
          </div>

          <div className="card">
            <h2>Last Login</h2>
            <p>5 hours ago from Discord auth</p>
          </div>
        </section>
      </main>
    </div>
  );
}
