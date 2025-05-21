import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import { getUserById, getUserRank } from "../api/userService";
import { useUserContext } from "../context/UserContext"; // <-- Import the context hook
import RecentOtherHits from "../components/RecentOtherHits"; // Add this import

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const { dbUser, setDbUser, userRank, setUserRank } = useUserContext(); 

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_USER_URL : import.meta.env.VITE_TEST_USER_URL}`, { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user && user.id) {
      getUserById(user.id)
        .then((data) => setDbUser(data))
        .catch(() => setDbUser(null));
    }
  }, [user, setDbUser]);

  useEffect(() => {
    if (dbUser && dbUser.id) {
      getUserRank(dbUser.rank)
        .then((data) => setUserRank(data))
        .catch(() => setUserRank(null));
    }
  }, [dbUser, setUserRank]);

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
          <a href="/piracy">Piracy</a>
          <a href="/scheduler">Training Scheduler</a>
          <a href="/warehouse">Warehouse</a>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Welcome, {user.username}#{user.discriminator}</h1>
          <p>Rank: {userRank?.name ? userRank.name : "Unknown"}</p>
          <img
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
            alt="User Avatar"
            className="avatar"
          />
        </section>

        <section className="dashboard-grid">
          {/* Left column: RecentOtherHits */}
          <div className="card recent-other-hits">
            <RecentOtherHits gameVersion={null} />
          </div>

          {/* Existing cards */}
          <div className="card">
            <h2>Fleet Assignment</h2>
            <h4>IronPoint Main</h4>
            <p>Current Task: Disrupt trade in Stanton and Pyro systems.</p>
          </div>

          <div className="card">
            <h2>Upcoming Missions</h2>
            <p>No current missions on the horizon.</p>
          </div>

          {/* Right column: Fleet Performance */}
          <div className="card fleet-performance">
            <h2>Fleet Performance</h2>
            <ul>
              <li>
                <strong>Alpha Squadron</strong>
                <p>Intercepted 3 convoys in Pyro this week.</p>
              </li>
              <li>
                <strong>Bravo Wing</strong>
                <p>Provided escort for mining ops in Stanton.</p>
              </li>
              <li>
                <strong>Recon Team</strong>
                <p>Scouted new jump points, no enemy contact.</p>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
